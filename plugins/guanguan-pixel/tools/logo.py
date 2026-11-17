import json,sys
# TCAN 圖示像素版：11x12 格，四個色塊
blocks=[('a',0,4,3,2,'#0ECBFF'),('b',4,2,3,4,'#0ECBFF'),('b',4,6,3,6,'#1E66F5'),('c',8,0,3,6,'#FF5563')]
css=("@keyframes up{0%,70%,100%{transform:translateY(0)}80%,90%{transform:translateY(-1px)}}"
 ".a{animation:up 1.2s steps(1) infinite}.b{animation:up 1.2s steps(1) .2s infinite}.c{animation:up 1.2s steps(1) .4s infinite}")
def svg(extra=''):
  g=''.join(f'<rect class="{k}" x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>' for k,x,y,w,h,c in blocks)
  return f'<svg xmlns="http://www.w3.org/2000/svg"{extra} viewBox="0 -1 11 13" shape-rendering="crispEdges"><style>{css}</style>{g}</svg>'
if sys.argv[1]=='ts': print('export const TCAN_ICON = '+json.dumps(svg()))
else: print(svg(' width="330" height="390" style="background:#fff"'))
