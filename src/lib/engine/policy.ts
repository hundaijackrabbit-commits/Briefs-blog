import type { ReviewMode, Verification } from "@/lib/types";
export function reviewMode(input:{verification:Verification;sourceTier:"A"|"B"|"C"|"D";risk:"normal"|"sensitive"|"high";objective:boolean;conflict:boolean}):ReviewMode{
  if(input.risk!=="normal" || input.conflict) return "manual";
  if(input.objective && input.sourceTier==="A" && input.verification==="confirmed") return "auto";
  return "review";
}
