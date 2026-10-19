import Lab from '../../components/Lab';
const slugs=['doping','junction-models','pn-depletion','built-in-potential','degenerate-doping','degenerate-junctions','schottky','schottky-bias','capacitance'];
export function generateStaticParams(){return slugs.map(slug=>({slug}))}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <Lab slug={slug}/>}
