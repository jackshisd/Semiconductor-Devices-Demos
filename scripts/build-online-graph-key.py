"""Build a personal study atlas from attributed online graph excerpts.
Run with PyMuPDF installed; source downloads and topics live in tmp/online-graphs.
Crop coordinates are fractions of the original PDF page; original vector art is retained.
"""
import sys,json,pathlib
sys.path.insert(0,'tmp/pdf-python')
import pymupdf as f
ROOT=pathlib.Path('tmp/online-graphs')
topics=json.loads((ROOT/'topics.json').read_text(encoding='utf-8'))
# Each topic may use more than one original graph excerpt.
def s(name,page,y0,y1,x0=.19,x1=.91):return (name,page,(x0,y0,x1,y1))
panels=[
 [s('ch1',11,.69,.805)],
 [s('ch1',17,.67,.895)],
 [s('ch1',20,.15,.435)],
 [s('ch1',28,.58,.79)],
 [s('ch2',8,.14,.47)],
 [s('ch2',9,.14,.51)],
 [s('mit6',9,.12,.38,.18,.85)],
 [s('ch4',33,.13,.52)],
 [s('ch4',46,.14,.54)],
 [s('ch4',48,.52,.86),s('ch4',50,.23,.33)],
 [s('ch4',3,.39,.74),s('ch4',10,.17,.57),s('ch4',17,.61,.80)],
 [s('ch4',7,.16,.85)],
 [s('ch4',11,.68,.86)],
 [s('ch4',11,.68,.86)],
 [s('ch4',22,.14,.36)],
 [s('ch4',25,.14,.57)],
 [s('ch4',13,.14,.53)],
 [s('ch4',15,.26,.69),s('ch4',16,.15,.40)],
 [s('ch4',23,.49,.65),s('ch4',27,.13,.51)],
 [s('mit15',3,.24,.63,.13,.88)],
 [s('mit15',6,.54,.87,.22,.81)],
 [s('mit15',11,.3,.76,.1,.9)],
 [s('mit15',14,.48,.77,.2,.8),s('mit15',11,.3,.76,.1,.9)],
 [s('ch4',26,.13,.50)],
 [s('varactor',3,.13,.41,.06,.94)],
 [s('ch4',31,.16,.34)],
 [s('ch4',34,.18,.42),s('ch4',36,.75,.87)],
 [s('ch5',29,.16,.80,.2,.535)],
 [s('ch5',29,.16,.80,.53,.85)],
 [s('ch5',4,.54,.77),s('ch5',6,.17,.37),s('ch5',9,.18,.38)],
 [s('ch5',11,.42,.86),s('ch5',12,.22,.50)],
 [s('ch5',11,.17,.35),s('ch5',10,.6,.88)],
 [s('ch5',15,.18,.43),s('ch5',24,.50,.61)],
 [s('ch5',30,.14,.34)],
 [s('ch5',16,.64,.81),s('ch5',17,.65,.78)],
 [s('ch5',19,.17,.53),s('ch5',22,.16,.34)],
 [s('ch6',19,.17,.85)],
 [s('ch6',17,.72,.87),s('ch6',30,.14,.87,.25,.80)],
 [s('ch6',13,.36,.88)],
]
notes={
4:'Read the horizontal axis carefully: this source uses inverse temperature, 1/T. High temperature is on the LEFT; freeze-out is on the RIGHT.',
7:'Mark the low-field slope (mobility), saturation field, and saturation velocity. This source uses a generic carrier-speed magnitude.',
11:'The source places N on the left and P on the right. Compare the energy barrier and separate quasi-Fermi levels under bias.',
13:'The source plots inverse-square junction capacitance against reverse voltage. A rising 1/C^2 means falling C and increasing depletion width. Infer W from W = permittivity x area / C.',
14:'This source uses positive reverse-bias voltage: the 1/C^2 slope is POSITIVE. The voltage-axis intercept is -Vbi.',
15:'Compare both neutral regions and their depletion edges. Source conventions and doping asymmetry affect the relative heights.',
16:'This textbook drawing neglects recombination inside the thin depletion region; each current component is constant across it.',
19:'Reference pair: the carrier-profile figure illustrates majority-carrier compensation; the I-V figure shows the high-current departure from the ideal law. The profile itself is a low-injection example. At high injection, excess n and p become comparable to or larger than the light-side doping.',
22:'These are VOLTAGE-switched waveforms with series resistance. Peak reverse current and recovery shape depend on the drive circuit.',
23:'The source shows voltage-driven turn-on and evolving minority-carrier profiles. It differs from the ideal constant-current Q(t) exercise; identify the driving condition before applying a transient equation.',
24:'These measured-style I-V curves show that the voltage needed for a fixed forward current falls as temperature rises. Draw a horizontal constant-current line to read the sensor response.',
25:'Manufacturer varactor C-V data, on linear and logarithmic axes. Reverse bias reduces capacitance. With a fixed inductor, resonance frequency increases as 1/sqrt(C). These are hyperabrupt varactors, so do not assume the abrupt-junction square-root C-V law.',
26:'The source includes dark and illuminated I-V curves and maximum-power rectangles. Mark Isc at V=0, Voc at I=0, and the maximum-power operating point. Its power is represented by rectangle area.',
28:'Left column of the original comparison: N-type DEVICE means an electron inversion channel in a P-type substrate. It includes flat band, accumulation, depletion, threshold, and inversion.',
29:'Right column: P-type DEVICE means a hole inversion channel in an N-type substrate. The gate-voltage polarity is reversed.',
32:'Reference pair: depletion width versus gate voltage and calculated surface potential versus gate voltage. Mark flat band, threshold, Wmax, and the approximate surface-potential plateau.',
34:'The source compares both substrate polarities. Identify the N-substrate / P-channel curve: inversion lies toward negative gate voltage.',
35:'Reference pair: oxide charge and flat-band extraction versus oxide thickness. These excerpts do not include a separate interface-trap stretch-out curve.',
38:'The first figure is an ideal output family. The second compares measured short- and long-channel curves; use the long-channel panel for the square-law model.',
}
suffix={1:'3',2:'2',4:'1',5:'1',6:'1'}
docs={}
def source(name):
 if name=='varactor':return ('Skyworks Solutions, SMV2025 varactor datasheet, Figure 1 and Figure 2','https://www.skyworksinc.com/-/media/31F43159F21B44B38FE05C79B55CC11F.pdf')
 if name.startswith('ch'):
  c=int(name[2:]);return ('Chenming Hu, Modern Semiconductor Devices for Integrated Circuits, chapter '+str(c),'https://www.chu.berkeley.edu/wp-content/uploads/2020/01/Chenming-Hu_ch'+str(c)+'-'+suffix[c]+'.pdf')
 return ('Jesus del Alamo, MIT OCW 6.720J, Spring 2007, lecture '+name[3:],(ROOT/(name+'.url')).read_text())
def text(p,rect,t,size=12,color=(.08,.19,.26)):
 t=t.replace('–','-').replace('—','-').replace('×','x').replace('−','-')
 result=p.insert_textbox(f.Rect(rect),t,fontsize=size,fontname='helv',color=color)
 if result<0:raise ValueError('Text overflow: '+t[:70])
out=f.open()
cover=out.new_page(width=792,height=612)
text(cover,(42,40,745,110),'EE 121B | ONLINE GRAPH REFERENCE ATLAS',25)
text(cover,(42,120,740,210),'39 numbered topics through Lecture 14\nOriginal online graph excerpts, with source links and reading notes',18)
text(cover,(42,240,740,400),'Graphs are cropped from publicly accessible author-hosted textbook chapters and MIT OpenCourseWare lecture notes. Original artwork and labels are retained. Some topics require paired figures; notes identify related references and differences from the original drawing exercise.\n\nPersonal study compilation. Source figures remain the property of their respective authors and credited rights holders. MIT excerpts: CC BY-NC-SA; https://ocw.mit.edu/terms/. Crops and layout were adapted; no endorsement is implied.',13)
text(cover,(42,450,740,550),'How to use: draw your answer first, then compare the axes, limiting values, slopes, polarities, and region boundaries. Source PDF links on every page open the cited page for context.',14)
total=1+sum(map(len,panels))
for topic,refs in zip(topics,panels):
 n=topic['n']
 for j,(name,pg,box) in enumerate(refs):
  if name not in docs:docs[name]=f.open(ROOT/(name+'.pdf'))
  src=docs[name];r=src[pg-1].rect;clip=f.Rect(max(0,box[0]-.035)*r.width,max(0,box[1]-.035)*r.height,min(1,box[2]+.025)*r.width,min(1,box[3]+.015)*r.height)
  # Give every original excerpt its own page. Tall band diagrams use portrait.
  portrait=clip.height/clip.width>1.05
  width,height=(612,792) if portrait else (792,612)
  p=out.new_page(width=width,height=height)
  text(p,(30,18,width-30,40),f'TOPIC {n:02d} / 39'+(f' | FIGURE {j+1} OF {len(refs)}' if len(refs)>1 else ''),11)
  text(p,(30,45,width-30,106),topic['title'],20)
  dest=f.Rect(30,114,width-30,height-153)
  p.draw_rect(dest,color=(.80,.85,.89),width=.6)
  p.show_pdf_page(dest,src,pg-1,clip=clip)
  note=notes.get(n,'Compare the original axis labels, marked energies, bias conditions, and limiting regions with your whiteboard drawing. Keep the source notation consistent throughout your answer.')
  text(p,(30,height-139,width-30,height-65),note,10.5)
  author,url=source(name);label=author+' | PDF p. '+str(pg)
  y=height-55;text(p,(30,y,width-30,y+30),label+'\nClick to open original source',8)
  p.insert_link({'kind':f.LINK_URI,'from':f.Rect(30,y,width-30,y+29),'uri':url+'#page='+str(pg)})
  text(p,(30,height-19,width-30,height-3),'Original source artwork | Cropped for study.                                      '+str(len(out))+' / '+str(total),8)
out.set_metadata({'title':'EE121B Online Graph Reference Atlas - All 39 Topics','author':'Study compilation; figures credited per page'})
path=pathlib.Path('output/pdf/ee121b-online-graph-reference-atlas.pdf');out.save(path,garbage=4,deflate=True)
assert len(out)==total
print(str(path),len(out),'pages')
