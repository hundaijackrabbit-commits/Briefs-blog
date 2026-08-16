export type StarterSource = {
  id:string;
  name:string;
  url:string;
  tier:"A"|"B"|"C"|"D";
  kind:"primary"|"reference"|"specialist";
};

export type StarterFact = {
  id:string;
  label:string;
  value:string;
  text:string;
  sourceIds:string[];
  confidence:"high"|"medium"|"low";
};

export type StarterTopic = {
  id:string;
  name:string;
  aliases:string[];
  category:string;
  summary:string;
  quickSummary:string;
  flashSummary:string;
  whyItMatters:string;
  facts:StarterFact[];
  sources:StarterSource[];
  watchItems:string[];
  knowledgeCutoff:string;
  dynamic:boolean;
};

const ww2:StarterTopic={
  id:"world-war-ii",
  name:"World War II",
  aliases:["ww2","world war ii","world war 2","second world war","the second world war"],
  category:"History",
  flashSummary:"World War II was a global war fought from 1939 to 1945 between the Allied and Axis powers. It transformed the international order and caused destruction on an unprecedented scale.",
  quickSummary:"World War II was a global conflict fought from 1939 to 1945. In Europe it began with Germany's invasion of Poland on September 1, 1939, and expanded across Europe, North Africa, Asia and the Pacific. The Allies ultimately defeated the Axis powers; Germany surrendered in May 1945 and Japan formally surrendered on September 2, 1945.",
  summary:"World War II was a global conflict fought from 1939 to 1945 between the Allied and Axis powers. In Europe, the war began when Nazi Germany invaded Poland on September 1, 1939. Fighting expanded across Europe, North Africa, Asia and the Pacific. The conflict included the Holocaust and other mass atrocities, strategic bombing, large-scale civilian displacement and the first wartime use of atomic bombs. Germany surrendered in May 1945; Japan formally surrendered on September 2, 1945. The war reshaped borders, accelerated decolonization, led to the creation of the United Nations and left the United States and Soviet Union as the dominant postwar powers.",
  whyItMatters:"World War II shaped the modern international system. Its aftermath influenced the United Nations, the Cold War, European integration, decolonization, international human-rights law and the geopolitical boundaries that still affect world affairs.",
  facts:[
    {id:"ww2-duration",label:"Duration",value:"1939–1945",text:"World War II lasted from 1939 to 1945.",sourceIds:["britannica-ww2","iwm-ww2"],confidence:"high"},
    {id:"ww2-europe-start",label:"War in Europe began",value:"September 1, 1939",text:"Germany invaded Poland on September 1, 1939, beginning the war in Europe.",sourceIds:["britannica-ww2","ushmm-ww2"],confidence:"high"},
    {id:"ww2-end",label:"Formal end",value:"September 2, 1945",text:"Japan formally surrendered on September 2, 1945, marking the end of World War II.",sourceIds:["britannica-ww2","iwm-ww2"],confidence:"high"},
    {id:"ww2-sides",label:"Major coalitions",value:"Allies and Axis",text:"The conflict was fought primarily between the Allied and Axis powers.",sourceIds:["britannica-ww2","iwm-ww2"],confidence:"high"},
    {id:"ww2-holocaust",label:"Holocaust",value:"Six million Jews murdered",text:"Nazi Germany and its collaborators murdered six million Jews during the Holocaust, alongside the persecution and murder of millions of other victims.",sourceIds:["ushmm-ww2"],confidence:"high"}
  ],
  sources:[
    {id:"ushmm-ww2",name:"United States Holocaust Memorial Museum — World War II",url:"https://encyclopedia.ushmm.org/content/en/article/world-war-ii-in-depth",tier:"A",kind:"reference"},
    {id:"iwm-ww2",name:"Imperial War Museums — What You Need to Know About the Second World War",url:"https://www.iwm.org.uk/history/what-you-need-to-know-about-the-second-world-war",tier:"A",kind:"reference"},
    {id:"britannica-ww2",name:"Encyclopaedia Britannica — World War II",url:"https://www.britannica.com/event/World-War-II",tier:"B",kind:"reference"}
  ],
  watchItems:[],
  knowledgeCutoff:"2026-08-16T00:00:00.000Z",
  dynamic:false
};

const ai:StarterTopic={
  id:"artificial-intelligence",
  name:"Artificial intelligence",
  aliases:["ai","artificial intelligence"],
  category:"Technology",
  flashSummary:"Artificial intelligence is the field of building computer systems that perform tasks associated with human intelligence, including perception, language, reasoning and decision-making.",
  quickSummary:"Artificial intelligence is a broad field concerned with systems that perform tasks associated with human intelligence. Modern AI includes machine learning, deep learning and generative models. Because capabilities and products change quickly, Briefs treats current-market claims as time-sensitive and requires live evidence for them.",
  summary:"Artificial intelligence is a broad field concerned with computer systems that can perform tasks associated with human intelligence, including perception, language processing, prediction, reasoning and decision-making. Much of modern AI is built with machine learning, including deep neural networks trained on large datasets. Generative AI systems produce text, images, audio, video or other outputs from learned statistical patterns. The field combines computer science, mathematics, statistics, cognitive science and domain expertise, while raising questions about reliability, safety, governance, labor and economic impact.",
  whyItMatters:"AI increasingly affects software, research, education, creative work, business operations and public policy. Its impact depends not only on model capability, but also on data, infrastructure, deployment choices, regulation and how people use the systems.",
  facts:[
    {id:"ai-risk-framework",label:"Risk framework",value:"NIST AI RMF",text:"NIST publishes the AI Risk Management Framework to help organizations manage risks associated with AI systems.",sourceIds:["nist-ai-rmf"],confidence:"high"}
  ],
  sources:[
    {id:"nist-ai-rmf",name:"NIST — AI Risk Management Framework",url:"https://www.nist.gov/itl/ai-risk-management-framework",tier:"A",kind:"primary"}
  ],
  watchItems:["Current model capabilities, regulation and market leadership require live-source verification."],
  knowledgeCutoff:"2026-08-16T00:00:00.000Z",
  dynamic:true
};

export const STARTER_TOPICS:StarterTopic[]=[ww2,ai];

function normalize(value:string){return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim();}

export function findStarterTopic(subject:string):StarterTopic|null{
  const needle=normalize(subject);
  if(!needle) return null;
  let best:StarterTopic|null=null;
  let bestScore=0;
  for(const topic of STARTER_TOPICS){
    for(const alias of [topic.name,...topic.aliases]){
      const a=normalize(alias);
      const score=needle===a?100:(needle.includes(a)||a.includes(needle)?70:0);
      if(score>bestScore){best=topic;bestScore=score;}
    }
  }
  return bestScore>=70?best:null;
}
