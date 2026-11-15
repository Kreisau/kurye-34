"""Economy model: how long a typical player needs to reach Kara and what they own by then.
Uses the game's own formulas (makeOffer, timeFor, finish, rivalBase, fines). The player profile is an assumption, set below;
tools/ride_bot.py measures what a rule-based rider actually does. Usage: python3 tools/econ_sim.py [runs]   (FAIL=.15 to vary)"""
import random, sys, os, statistics as st
NDEL=5; STREAK=[1,1.15,1.3,1.5,1.75]; ZONE_DEL=int(os.environ.get('ZD',12)); LVL_DEL=ZONE_DEL//2
KINDS={'YAKIN':(.75,.75),'NORMAL':(1,1),'UZAK':(1.35,1.5)}
BIKES=[('mob',0,.48),('sc',1200,.6),('k150',3000,.72),('n250',6500,.85),('s600',12000,1)]
ZREF=[.48,.54,.62,.70,.78,.85]; TMUL=[1,1,1.12,1,1.08,1]
UPC=[300,700,1500,3000,5000]; PK=float(os.environ.get('PK',15))
# --- typical player (assumptions): package left, average speed as a share of the bike's top, knock-down value per delivery
# (a knock-down counts 1, putting a rival out 2), chance of a fine per delivery, seconds spent in menus ---
P=dict(fail=float(os.environ.get('FAIL',.08)), cond=.8, pace=.72, tipstars=.10, kd=3, fine=.25, over_del=22, over_shift=15, kind=('NORMAL','UZAK'))
WISH=['sc','w:bat','u0','u2','k150','u0','u2','w:chain','u4','u0','n250','u2','u4','u0','w:bar','u2','u4','s600','u0','u2','u4','u4']
CARD=1.08   # average effect of the shift card on pay (Bonkör Müşteri +25% picked about a third of the time)
def run(seed):
    R=random.Random(seed); money=0; pd=0; shifts=0; secs=0; bike=.48; owned={'mob'}; upg=[0]*5; wi=0; log=[]; mark=LVL_DEL
    while pd<6*ZONE_DEL:
        L=min(12,pd//LVL_DEL); pot=0; ok=True
        for i in range(NDEL):
            d=L*3+i; kind=KINDS[R.choice(P['kind'])]; z=min(5,pd//ZONE_DEL); top=bike*(1+.03*upg[0])
            ln=min(2400,min(1780,600+d*90)*kind[0]); t=max(ln/(60*ZREF[z]*.5)+10,ln/(60*top*.62)+8)*TMUL[z]
            used=min(t,ln/(60*top*P['pace'])+6); tr=1-used/t
            ev=1.2 if R.random()<[0 if L<2 else .2,.4,.6,.7,.8][i] else 1
            pay=(40+d*PK)*kind[1]*ev*CARD*STREAK[i]
            if R.random()<P['fail'] or tr<=0: secs+=used*.6+P['over_del']; ok=False; break
            secs+=used+P['over_del']; pd+=1
            pot+=pay*P['cond']+pay*tr*.5+pay*P['tipstars']*1.15+P['kd']*17.5*(1+d/12)-P['fine']*.3*(40+d*15)
        secs+=P['over_shift']
        if ok: money+=pot+50+L*25; shifts+=1
        while ok and wi<len(WISH):
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
        while pd>=mark: log.append((mark,round(secs/60),max(owned,key=lambda x:[y[0] for y in BIKES].index(x)),sum(upg),round(money))); mark+=LVL_DEL
    return secs/60, log, wi, bike, shifts
runs=int(sys.argv[1]) if len(sys.argv)>1 else 400
res=[run(s) for s in range(runs)]
mins=[r[0] for r in res]; print('minutes to Kara: median %.0f  p10 %.0f  p90 %.0f'%(st.median(mins),sorted(mins)[runs//10],sorted(mins)[runs*9//10]))
print('wishlist items bought (of %d): median %d | Sport 600 owned: %d%% | shifts started that were completed: median %d'%(len(WISH),st.median([r[2] for r in res]),100*sum(r[3]==1 for r in res)//runs,st.median([r[4] for r in res])))
print('sample run (deliveries, minutes, best bike, part levels, money left):'); [print(' ',x) for x in res[0][1]]
