import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type { Mystery } from './types.js';

const SuspectSchema = z.object({ id: z.string(), name: z.string(), role: z.string(), background: z.string(), relationship: z.string(), motive: z.string(), initialStatement: z.string(), alibi: z.string(), knowledge: z.string() });
const ClueSchema = z.object({ id: z.string(), title: z.string(), description: z.string(), location: z.string(), relevance: z.string(), isDiscoverable: z.boolean() });
const MysterySchema = z.object({ title: z.string(), introduction: z.string(), description: z.string(), suspects: z.array(SuspectSchema).min(3).max(5), clues: z.array(ClueSchema).min(5).max(8), timeline: z.array(z.string()).min(3), culpritId: z.string(), solution: z.string(), motive: z.string(), decisiveClueIds: z.array(z.string()).min(1), hints: z.tuple([z.string(), z.string(), z.string()]) });

export const sampleMystery: Mystery = {
 title:'The Last Pour', introduction:'A storm has sealed the doors of the Bellweather Hotel. Before midnight, its famous clockmaker was found unconscious beside a missing pocket watch.', description:'At 9:20 PM, master clockmaker Elias Wren was discovered in the hotel conservatory. His prized gold watch has vanished. The room was locked from the inside, and only the staff and a handful of guests remained in the building.',
 suspects:[
  {id:'mara',name:'Mara Voss',role:'Hotel manager',background:'A precise, composed manager who has run Bellweather for twelve years.',relationship:'Elias threatened to expose her sale of hotel antiques.',motive:'A scandal could cost Mara her position and home.',initialStatement:'I was in the lobby balancing the books. I heard the storm, nothing else.',alibi:'Claims she stayed at the front desk from 9:00 to 9:30.',knowledge:'Knows the service corridors and the conservatory doors.'},
  {id:'felix',name:'Felix Wren',role:'Nephew',background:'A charming but debt-ridden pianist staying at the hotel.',relationship:'Elias was his uncle and recently changed his will.',motive:'He expected to inherit the watch and needed money.',initialStatement:'I was practicing in the music room. The storm made it hard to hear anything.',alibi:'The housekeeper heard piano music until shortly after nine.',knowledge:'Knows the watch was usually kept in Elias’s coat pocket.'},
  {id:'dr_sato',name:'Dr. Emi Sato',role:'Guest physician',background:'A botanist and physician attending a nearby conference.',relationship:'She and Elias argued over a rare plant in the conservatory.',motive:'Elias planned to report that she had taken cuttings from his collection.',initialStatement:'I left the conservatory before nine. I was in my room when the commotion began.',alibi:'Says she was upstairs, though nobody saw her there.',knowledge:'Recognizes the sedative properties of the conservatory’s foxglove.'},
  {id:'owen',name:'Owen Pike',role:'Night porter',background:'A quiet porter who has worked the night shift for years.',relationship:'Elias often asked him to wind the hotel’s old clocks.',motive:'Elias had caught him taking small valuables from guests.',initialStatement:'I was checking the back entrance. It’s been rattling all evening.',alibi:'Was seen carrying coal at 9:15.',knowledge:'Has keys to most public rooms, but says the conservatory key was missing.'}
 ],
 clues:[
  {id:'teacup',title:'The untouched tea',description:'A cup of tea sits cold by the conservatory chair. Its rim is clean, but a faint herbal scent lingers.',location:'Conservatory table',relevance:'Suggests Elias never drank the tea; the scent may have another source.',isDiscoverable:true},
  {id:'mud',title:'A crescent of wet soil',description:'A small crescent of dark soil lies near the inner latch, despite the conservatory floor being dry elsewhere.',location:'Inside conservatory door',relevance:'Someone may have reached the latch after coming in from the garden.',isDiscoverable:true},
  {id:'ledger',title:'The hotel ledger',description:'A page records a delivery of foxglove fertilizer at 8:40 PM, signed with the initials E.S.',location:'Manager’s office',relevance:'Connects a suspect to a plant with sedative properties.',isDiscoverable:true},
  {id:'key',title:'A spare key tag',description:'The conservatory key tag is back on its hook, but its brass surface is damp.',location:'Service hallway',relevance:'The missing key was returned after the incident.',isDiscoverable:true},
  {id:'watch_chain',title:'A snapped watch chain',description:'A tiny gold link is caught on the conservatory’s garden window latch.',location:'Garden window',relevance:'The watch was taken through the window, not the locked door.',isDiscoverable:true},
  {id:'glove',title:'A stained glove',description:'A gardening glove has a pale powder stain on the fingertips.',location:'Potting bench',relevance:'The powder is consistent with the foxglove preparation used to incapacitate Elias.',isDiscoverable:true},
 ], timeline:['8:40 PM — A delivery of gardening supplies arrives at the service entrance.','9:00 PM — Elias enters the conservatory to inspect his plants.','9:10 PM — Piano music stops in the music room.','9:20 PM — Owen finds Elias unconscious; the watch is missing.'], culpritId:'dr_sato', solution:'Dr. Emi Sato used a foxglove preparation to incapacitate Elias, then took the watch through the garden window and re-latched it from outside. The locked-room appearance was created by entering with the conservatory key and returning it to the service hallway.', motive:'Elias had discovered that Dr. Sato had taken cuttings from his rare plants and planned to report her. She needed the watch to look like an ordinary theft and buy time to leave town.', decisiveClueIds:['ledger','watch_chain','glove'], hints:['Look closely at the garden window and ask whether the room was truly sealed.','The delivery record and the powder on the glove point to someone who understands plants.','The initials on the delivery ledger match Dr. Sato, and the snapped chain shows how the watch left the room.'],
};

export async function generateMystery(): Promise<Mystery> {
 const apiKey=process.env.GEMINI_API_KEY;
 if (!apiKey) return structuredClone(sampleMystery);
 const ai=new GoogleGenAI({apiKey});
 const prompt=`Create a fair-play, solvable locked-room mystery for a casual detective game. Return only JSON matching this shape: {"title":"","introduction":"","description":"","suspects":[{"id":"","name":"","role":"","background":"","relationship":"","motive":"","initialStatement":"","alibi":"","knowledge":""}],"clues":[{"id":"","title":"","description":"","location":"","relevance":"","isDiscoverable":true}],"timeline":[""],"culpritId":"must match suspect id","solution":"","motive":"","decisiveClueIds":["must match clue ids"],"hints":["general","connect clues","strong"]}. Use 3-5 suspects, 5-8 clues, at least 3 timeline events. Keep all facts consistent. Avoid supernatural solutions. Make suspect and clue IDs simple lowercase identifiers.`;
 const response=await ai.models.generateContent({model:process.env.GEMINI_MODEL||'gemini-2.5-flash',contents:prompt,config:{responseMimeType:'application/json'}});
 const raw=response.text;
 if(!raw) throw new Error('The mystery service returned an empty response.');
 const mystery=MysterySchema.parse(JSON.parse(raw));
 if(!mystery.suspects.some(s=>s.id===mystery.culpritId)) throw new Error('Generated mystery has an unknown culprit.');
 if(mystery.decisiveClueIds.some(id=>!mystery.clues.some(c=>c.id===id))) throw new Error('Generated mystery has an unknown decisive clue.');
 return mystery;
}
