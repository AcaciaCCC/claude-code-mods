import json,sys
N=16; c=(N-1)/2; R=7.0
inside=[[ (x-c)**2+(y-c)**2 <= R*R for x in range(N)] for y in range(N)]
def edge(x,y):
  return inside[y][x] and any(not(0<=x+dx<N and 0<=y+dy<N and inside[y+dy][x+dx]) for dx,dy in((1,0),(-1,0),(0,1),(0,-1)))
# 32-wide land map (G land, g dark land, w ice)
MAP=[
"................................",
"......wwww.............wwwww....",
"....GGG......GG...............w.",
"...GGGGG....GGGGG.....GGGG......",
"..GGGgGGG..GGGGGGG...GGGGGG.....",
"..GGGGGG...GGgGGG...GGGGgGGG....",
"...GGGG.....GGGG....GGGGGGGGG...",
"....GG.......GGG.....GGGGGG.....",
".....GG......GGGG.....GGG.......",
"......GGG.....GGG......G....GG..",
"......GGGG....GG...........GGGG.",
".......GG.....G............GGG..",
"........G.....................G.",
"................................",
"..........wwwwww......wwww......",
"................................"]
pal={'G':'#4caf50','g':'#2e7d32','w':'#f2f6fa'}
def strip(x0):
  o=[]
  for y,r in enumerate(MAP):
    for x,ch in enumerate(r):
      if ch!='.': o.append(f'<rect x="{x+x0}" y="{y}" width="1" height="1" fill="{pal[ch]}"/>')
  return ''.join(o)
clip=''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for y in range(N) for x in range(N) if inside[y][x] and not edge(x,y))
ocean=''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="#3a8fd6"/>' for y in range(N) for x in range(N) if inside[y][x] and not edge(x,y))
rim=''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="#1d4f86"/>' for y in range(N) for x in range(N) if edge(x,y))
shade=''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="#000" opacity=".18"/>' for y in range(N) for x in range(N) if inside[y][x] and not edge(x,y) and (x-c-3)**2+(y-c-3)**2> (R+1.5)**2 - 0 and (x+y)>N)
hl='<rect x="4" y="4" width="2" height="1" fill="#fff" opacity=".55"/><rect x="4" y="5" width="1" height="1" fill="#fff" opacity=".55"/>'
def svg(sec=8, size=None):
  sz=f' width="{size}" height="{size}"' if size else ''
  css=f"@keyframes spin{{from{{transform:translateX(0)}}to{{transform:translateX(-32px)}}}}.m{{animation:spin {sec}s steps(32) infinite}}"
  return (f'<svg xmlns="http://www.w3.org/2000/svg"{sz} viewBox="0 0 {N} {N}" shape-rendering="crispEdges">'
   f'<style>{css}</style><defs><clipPath id="c">{clip}</clipPath></defs>{ocean}'
   f'<g clip-path="url(#c)"><g class="m">{strip(0)}{strip(32)}</g></g>{shade}{hl}{rim}</svg>')
if sys.argv[1]=='ts':
  print('export const EARTH = '+json.dumps(svg()))
  print('export const EARTH_FAST = '+json.dumps(svg(2.5)))
else: print(svg(size=400).replace('class="m"','class="m" transform="translate(-6 0)"'))
