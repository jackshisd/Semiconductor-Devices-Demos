"""Extract high-resolution original online textbook figures for the formula sheets."""
import sys,pathlib,json
sys.path.insert(0,'tmp/pdf-python')
import pymupdf as fitz
dest=pathlib.Path('public/guides/source-graphs');dest.mkdir(parents=True,exist_ok=True)
# Tight crops retain axes and labels, excluding the surrounding textbook prose.
items={
 'mobility':(2,8,(.30,.145,.75,.39),'2-5'),
 'resistivity':(2,11,(.23,.12,.82,.67),'2-8'),
 'schottky-n':(4,46,(.30,.14,.80,.315),'4-34a'),
 'schottky-p':(4,46,(.30,.315,.80,.465),'4-34b'),
 'pn-equilibrium':(4,3,(.25,.545,.81,.735),'4-3'),
 'pn-forward':(4,17,(.49,.60,.84,.80),'4-14'),
 'mos-accumulation':(5,4,(.47,.50,.86,.765),'5-5b'),
 'mos-inversion':(5,9,(.47,.125,.86,.375),'5-9b'),
 'minority':(4,22,(.27,.14,.80,.315),'4-18'),
 'current':(4,25,(.27,.33,.81,.515),'4-20b'),
 'diode-iv':(4,13,(.27,.14,.81,.37),'4-10a'),
 'inverse-cv':(4,11,(.27,.64,.84,.835),'4-9'),
 'mos-charge':(5,12,(.25,.23,.83,.485),'5-14'),
 'mosfet-output':(6,17,(.29,.65,.83,.84),'6-16'),
 'mos-cv':(5,15,(.23,.13,.85,.405),'5-18'),
 'mos-shift':(5,16,(.23,.615,.85,.79),'5-20'),
}
manifest={}
for key,(chapter,page,coords,figure) in items.items():
 src=pathlib.Path(f'tmp/online-graphs/ch{chapter}.pdf')
 if not src.exists():
  import urllib.request
  suffix={2:'2',4:'1',5:'1',6:'1'}[chapter]
  src.parent.mkdir(parents=True,exist_ok=True)
  urllib.request.urlretrieve(f'https://www.chu.berkeley.edu/wp-content/uploads/2020/01/Chenming-Hu_ch{chapter}-{suffix}.pdf',src)
 doc=fitz.open(src);p=doc[page-1];r=p.rect
 clip=fitz.Rect(coords[0]*r.width,coords[1]*r.height,coords[2]*r.width,coords[3]*r.height)
 p.get_pixmap(matrix=fitz.Matrix(4,4),clip=clip).save(dest/(key+'.png'))
 manifest[key]={'chapter':chapter,'page':page,'figure':figure,'url':f'https://www.chu.berkeley.edu/wp-content/uploads/2020/01/Chenming-Hu_ch{chapter}-'+('2' if chapter==2 else '1')+'.pdf#page='+str(page)}
(dest/'sources.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print('Extracted',len(items),'source figures')
