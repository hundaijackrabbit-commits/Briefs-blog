import type { Metadata } from "next";
import MyBriefsClient from "./personal-client";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"My Briefs",robots:{index:false,follow:false}};
export default function MyBriefs(){return <MyBriefsClient/>;}
