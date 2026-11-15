"""Economy model: how long a typical player needs to reach Kara and what they own by then.
Uses the game's own formulas (makeOffer, refSpeed, rating, finish). Player profile is an assumption, set below.
Usage: python3 tools/econ_sim.py [runs]"""
import random, sys, statistics as st
NDEL=5; STREAK=[1,1.15,1.3,1.5,1.75]
KINDS={'YAKIN':(.75,.75),'NORMAL':(1,1),'UZAK':(1.35,1.5)}
BIKES=[('mob',0,.48),('sc',1200,.6),('k150',3000,.72),('n250',6500,.85),('s600',12000,1)]
UPC=[300,700,1500,3000,5000]; import os
CLUE_AT=[1,3,5,7,9]; KARA=int(os.environ.get('KARA',12)); PK=float(os.environ.get('PK',15)); TMUL=[1,1,1.12,1,1.08,1]
# --- typical player (assumptions) ---
P=dict(fail=.08, cond=.85, used=.70, stars=4, rival=35, fines=20, over_del=22, over_shift=15, kind=('NORMAL','UZAK'))
WISH=['sc','w:bat','u0','u2','k150','u0','u2','w:chain','u4','u0','n250','u2','u4','u0','w:bar','u2','u4','s600','u0','u2','u4','u4']
CARD=1.08   # average effect of the shift card on pay (Bonkör Müşteri +25% picked about a third of the time)
def run(seed):
    R=random.Random(seed); money=0; shifts=0; secs=0; bike=.48; owned={'mob'}; upg=[0]*5; wi=0; log=[]
    while shifts<KARA:
        L=shifts; pot=0; ok=True
        for i in range(NDEL):
            d=L*3+i; kind=KINDS[R.choice(P['kind'])]; D=min(5,shifts//2)
            top=bike*(1+.05*upg[0]); ref=(.24+.23*(top-.48))*(1+min(.2,d*.008))
            ln=min(2400,(600+d*90)*kind[0]); t=(ln/(60*ref)+10)*TMUL[D]
            ev=1.2 if R.random()<[0 if L<2 else .2,.4,.6,.7,.8][i] else 1
            pay=(40+d*PK)*kind[1]*ev*CARD*STREAK[i]
            if R.random()<P['fail']: secs+=t*.6+P['over_del']; ok=False; break
            secs+=t*P['used']+P['over_del']
            pot+=pay*P['cond']+pay*.10*1.15+1.5*t*(1-P['used'])+P['rival']-P['fines']
        secs+=P['over_shift']
        if not ok: continue
        money+=pot+50+L*25; shifts+=1
        while wi<len(WISH):
            w=WISH[wi]
            if w.startswith('u'):
                k=int(w[1]); c=UPC[upg[k]]
                if money<c: break
                money-=c; upg[k]+=1
            elif w.startswith('w:'):
                c={'bat':600,'chain':1500,'bar':3000}[w[2:]]
                if money<c: break
                money-=c
            else:
                b=[x for x in BIKES if x[0]==w][0]
                if money<b[1]: break
                money-=b[1]; bike=b[2]; owned.add(w)
            wi+=1
        log.append((shifts,round(secs/60),max(owned,key=lambda x:[y[0] for y in BIKES].index(x)),sum(upg),round(money)))
    return secs/60, log, wi, bike
runs=int(sys.argv[1]) if len(sys.argv)>1 else 400
res=[run(s) for s in range(runs)]
mins=[r[0] for r in res]; print('minutes to Kara: median %.0f  p10 %.0f  p90 %.0f'%(st.median(mins),sorted(mins)[runs//10],sorted(mins)[runs*9//10]))
print('wishlist items bought (of %d): median %d | Sport 600 owned: %d%%'%(len(WISH),st.median([r[2] for r in res]),100*sum(r[3]==1 for r in res)//runs))
print('sample run (shift, minutes, best bike, part levels, money left):'); [print(' ',x) for x in res[0][1]]
