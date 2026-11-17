import json
pal={'O':'#a8875a','C':'#f4e6bf','H':'#fdf6e3','S':'#e3cd98','R':'#d9d2c0','r':'#b3aa95','T':'#6b4a36','t':'#3d2a20',
 'K':'#3a3430','k':'#a8998a','W':'#ffffff','P':'#f4a6a0','L':'#ead6a2',
 'a':'#2b5c9e','b':'#5b8fcf','c':'#9cc3e6','d':'#f0d6cc','e':'#e88a7a','f':'#c9403a','g':'#8e1e22'}
def B(mid): return "...OH"+mid+"SO..."
body=["........TTTT........","........TttT........","....rrrrrrTTrrrr....","...rRRRRRRRRRRRRr...",
B("CCCCCCCCCC"),B("CCCCCCKKCC"),B("CKKCCCKKCC"),B("CKKCCCKKCC"),B("CCCCCCKKCC"),B("CCCCWWCCCC"),
B("CPCKWWKCPC"),".OO"+"OH"+"CCCKWWKCCC"+"SO"+"OO.","OLL"+"OH"+"CCCKKKKCCC"+"SO"+"LLO",".OO"+"OH"+"CCCKKKKCCC"+"SO"+"OO.",
B("CCCCKKCCCC"),B("CCCCCCCCCC"),"...O"+"aabbccdeeffg"+"O...",B("CCCCCCCCCC"),"...OSSSSSSSSSSSSO...","....OOOOOOOOOOOO...."]
for i,r in enumerate(body): assert len(r)==20,(i,r,len(r))
wink=list(body)
for i,r in zip(range(5,10),[B("KKCCCCKKCC"),B("CKKCCCKKCC"),B("CCKKCCKKCC"),B("CKKCCCKKCC"),B("KKCCWWCCCC")]): wink[i]=r
legA=[".....OLLO..OLLO.....",".....OOOO..OOOO....."]
legB=["....OLLO....OLLO....","....OOOO....OOOO...."]
def rects(rows,y0=0):
  o=[]
  for y,r in enumerate(rows):
    x=0
    while x<len(r):
      ch=r[x]
      if ch=='.': x+=1; continue
      w=1
      while x+w<len(r) and r[x+w]==ch: w+=1
      o.append(f'<rect x="{x}" y="{y+y0}" width="{w}" height="1" fill="{pal[ch]}"/>'); x+=w
  return ''.join(o)
blink=''.join(f'<rect x="{x}" y="{y}" width="2" height="1" fill="#f4e6bf"/>' for x,y in ((6,6),))+''.join(f'<rect x="11" y="{y}" width="2" height="1" fill="#f4e6bf"/>' for y in (5,6,8))
blink_big=''.join(f'<rect x="11" y="{y}" width="2" height="1" fill="#f4e6bf"/>' for y in (5,6,8))
def svg(sp,bd=None,bl=None):
  bd=bd or body; bl=blink if bl is None else bl
  css=(f"@keyframes bob{{0%,49%{{transform:translateY(0)}}50%,100%{{transform:translateY(-1px)}}}}"
  "@keyframes fa{0%,49%{opacity:1}50%,100%{opacity:0}}@keyframes fb{0%,49%{opacity:0}50%,100%{opacity:1}}"
  "@keyframes bl{0%,90%{opacity:0}91%,100%{opacity:1}}"
  f".b{{animation:bob {sp}s steps(1) infinite}}.a{{animation:fa {sp}s steps(1) infinite}}.z{{opacity:0;animation:fb {sp}s steps(1) infinite}}.e{{opacity:0;animation:bl 3.2s steps(1) infinite}}")
  return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -1 20 22" shape-rendering="crispEdges">'
   f'<style>{css}</style><g class="b">{rects(bd)}<g class="e">{bl}</g></g>'
   f'<g class="a">{rects(legA,19)}</g><g class="z">{rects(legB,19)}</g></svg>')
def still(): return f'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="440" style="background:#fff" viewBox="0 -1 20 22" shape-rendering="crispEdges">{rects(body)}{rects(legA,19)}</svg>'
if __name__=="__main__":
  import sys
  if sys.argv[1]=="ts":
    print('// 像素版罐罐（TCAN 吉祥物），由 gen2.py 產生。')
    print('export const WALK = '+json.dumps(svg(0.5)))
    print('export const IDLE = '+json.dumps(svg(0.9)))
    print('export const WINK = '+json.dumps(svg(0.9,wink,blink_big)))
  else: print(still())
