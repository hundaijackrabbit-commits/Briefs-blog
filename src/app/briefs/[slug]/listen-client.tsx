"use client";
import { useEffect, useState } from "react";

export default function ListenClient({title,text}:{title:string;text:string}){
  const [supported,setSupported]=useState(false); const [speaking,setSpeaking]=useState(false);
  useEffect(()=>{setSupported(typeof window!=="undefined"&&"speechSynthesis" in window);return()=>{if(typeof window!=="undefined")window.speechSynthesis?.cancel();};},[]);
  if(!supported) return null;
  function toggle(){if(window.speechSynthesis.speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}const utterance=new SpeechSynthesisUtterance(`${title}. ${text}`);utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);window.speechSynthesis.speak(utterance);setSpeaking(true);}
  return <button className="listen-button" type="button" onClick={toggle}>{speaking?"Stop listening":"Listen"}</button>;
}
