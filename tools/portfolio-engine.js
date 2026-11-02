"use strict";
/* Pure portfolio accounting module. Amounts are TRY; never round intermediate calculations.
   Legacy trades are left untouched: cash movements are independent events.
   Cash inflows/outflows are external investor flows; dividends are internal income. */
function n(v){return typeof v==="number"&&Number.isFinite(v)?v:null}
function iso(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||""))?v:null}
function summarizePortfolio({positions=[],events=[],cashOpening=0}={}){
  if(n(cashOpening)===null)throw Error("Invalid opening cash");
  const out={holdingsValue:0,investedCost:0,unrealizedPnL:0,realizedPnL:0,
    dividends:0,fees:0,cash:cashOpening,deposits:0,withdrawals:0,errors:[]};
  for(const p of positions){
    const units=n(p.units),price=n(p.currentPrice),cost=n(p.cost);
    if(units===null||units<0||price===null||price<0||cost===null||cost<0){
      out.errors.push("invalid position "+(p.code||""));continue;
    }
    out.holdingsValue+=units*price;out.investedCost+=cost;
  }
  const sorted=[...events].sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))||String(a.id||"").localeCompare(String(b.id||"")));
  for(const e of sorted){
    const amount=n(e.amount);
    if(!iso(e.date)||amount===null||amount<=0){out.errors.push("invalid event "+(e.id||""));continue;}
    switch(e.type){
      case "deposit":out.cash+=amount;out.deposits+=amount;break;
      case "withdrawal":out.cash-=amount;out.withdrawals+=amount;break;
      case "dividend":out.cash+=amount;out.dividends+=amount;break;
      case "fee":out.cash-=amount;out.fees+=amount;break;
      case "buy":out.cash-=amount;break; // cost is represented in the position cost basis
      case "sell":out.cash+=amount;break; // realized P/L requires separate cost-basis ledger
      default:out.errors.push("unknown event "+e.type);
    }
  }
  out.unrealizedPnL=out.holdingsValue-out.investedCost;
  out.totalValue=out.holdingsValue+out.cash;
  out.netDeposits=out.deposits-out.withdrawals;
  out.netContributions=out.netDeposits+cashOpening;
  out.equityGain=out.totalValue-out.netContributions;
  return out;
}
module.exports={summarizePortfolio};
