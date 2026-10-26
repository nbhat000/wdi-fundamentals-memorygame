import { mkdirSync, writeFileSync } from "node:fs";
import { loadConfig } from "./env.js";
import { getLeague, getRosters, getFreeAgents, type LeagueParams } from "./espn/reads.js";
import { computeOptimalLineup } from "./optimalLineup.js";
import { setLineup } from "./espn/writes.js";

const cfg=loadConfig();
const params:LeagueParams={sport:"ffl",season:cfg.defaultSeason,leagueId:cfg.defaultLeagueId ?? ""};
const teamId=cfg.defaultTeamId ?? 0;
if(!params.leagueId || !teamId)throw Error("ESPN_LEAGUE_ID and ESPN_TEAM_ID required.");
const league=await getLeague(params);
const week=league.currentScoringPeriod;
if(!week)throw Error("ESPN scoring period unavailable.");
const team=(await getRosters(params,teamId,week))[0];
if(!team)throw Error("Cannot read team roster.");
const recommendation=computeOptimalLineup("ffl",team.players,league.rosterSlotCounts ?? {},{scoringPeriodId:week});
const moves=recommendation.starters.filter(s=>s.isChange&&s.playerId!==null).map(s=>({playerId:s.playerId!,toSlot:s.slotId}));
const freeAgents=await getFreeAgents(params,{limit:40,sortBy:"projection"});
const report={timestamp:new Date().toISOString(),week,teamName:team.teamName,mode:process.env.AUTO_EXECUTE==="true"?"live-eligible":"dry-run",lineup:recommendation,moves,freeAgents:freeAgents.slice(0,12).map(p=>({id:p.id,name:p.name,position:p.position,seasonProjection:p.seasonProjection})),caveat:"ESPN projections only; waivers, adds and drops are never automated."};
mkdirSync("reports",{recursive:true});
writeFileSync("reports/latest.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(moves.length){
 const outcome=await setLineup(params,{teamId,moves,scoringPeriodId:week},process.env.AUTO_EXECUTE!=="true");
 console.log("ESPN_RESULT",JSON.stringify(outcome));
 if(outcome.blockedReason || outcome.verifyMismatches?.length)process.exitCode=1;
}
