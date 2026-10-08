/* ELDTrack demo: HOS math + 24-hour log grid drawing. Sample data only. */
(function(){
  var NS="http://www.w3.org/2000/svg";
  var ROWS=["OFF","SB","D","ON"]; // row index: 0 OFF, 1 SB, 2 D, 3 ON

  function fmt(h){h=Math.max(0,h);var m=Math.round(h*60);return Math.floor(m/60)+":"+String(m%60).padStart(2,"0");}

  // segments: [{s:startHour,e:endHour|null,row}] ; e null = still running until now
  function clip(segs,now){return segs.map(function(g){return{s:g.s,e:Math.min(g.e==null?now:g.e,now),row:g.row};}).filter(function(g){return g.e>g.s;});}

  function calc(segs,now,priorCycle){
    var c=clip(segs,now),drive=0,onDuty=0,shiftStart=null,since=0,tot=[0,0,0,0];
    c.forEach(function(g){var len=g.e-g.s;tot[g.row]+=len;
      if(g.row===2||g.row===3){if(shiftStart===null)shiftStart=g.s;onDuty+=len;}
      if(g.row===2){drive+=len;since+=len;}else if(len>=0.5){since=0;}});
    var shiftUsed=shiftStart===null?0:now-shiftStart;
    var r={
      drive:11-drive, shift:14-shiftUsed, brk:8-since, cycle:70-priorCycle-onDuty,
      totals:tot, driveUsed:drive
    };
    r.canDrive=Math.min(r.drive,r.shift,r.brk,r.cycle);
    return r;
  }

  function drawGrid(svg,segs,now,opts){
    opts=opts||{};
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    var L=58,T=22,HW=35,RH=40,W=24*HW;
    function el(n,a,t){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(t!=null)e.textContent=t;svg.appendChild(e);return e;}
    var mono="IBM Plex Mono,ui-monospace,monospace";
    for(var r=0;r<4;r++){
      el("rect",{x:L,y:T+r*RH,width:W,height:RH,fill:"none",stroke:"var(--grid-strong)","stroke-width":1});
      el("text",{x:L-10,y:T+r*RH+RH/2+5,"text-anchor":"end","font-family":mono,"font-size":13,"font-weight":600,fill:"var(--ink)"},ROWS[r]);
    }
    for(var h=0;h<=24;h++){
      var x=L+h*HW;
      el("line",{x1:x,y1:T,x2:x,y2:T+4*RH,stroke:"var(--grid-strong)","stroke-width":1});
      if(h<24){for(var q=1;q<4;q++){var xq=x+q*HW/4;for(var r2=0;r2<4;r2++){el("line",{x1:xq,y1:T+r2*RH+RH-(q===2?14:8),x2:xq,y2:T+r2*RH+RH,stroke:"var(--grid)","stroke-width":1});}}}
      var lab=(h===0||h===24)?"M":h===12?"N":String(h>12?h-12:h);
      el("text",{x:x,y:T-7,"text-anchor":"middle","font-family":mono,"font-size":11,fill:"var(--muted)"},lab);
    }
    var res=calc(segs,now,opts.priorCycle||48);
    for(var r3=0;r3<4;r3++)el("text",{x:L+W+44,y:T+r3*RH+RH/2+5,"text-anchor":"middle","font-family":mono,"font-size":13,"font-weight":600,fill:"var(--ink)"},fmt(res.totals[r3]));
    var pts=[],prev=null;
    clip(segs,now).forEach(function(g){var y=T+g.row*RH+RH/2,x1=L+g.s*HW,x2=L+g.e*HW;if(prev!==null)pts.push(x1+","+prev);pts.push(x1+","+y,x2+","+y);prev=y;});
    if(pts.length)el("polyline",{"class":opts.animate?"trace-anim":"",points:pts.join(" "),fill:"none",stroke:"var(--accent)","stroke-width":3,"stroke-linejoin":"round"});
    var nx=L+now*HW;
    el("line",{x1:nx,y1:T-2,x2:nx,y2:T+4*RH+2,stroke:"var(--shield)","stroke-width":2,"stroke-dasharray":"4 3"});
    el("text",{x:Math.min(nx,L+W-14),y:T+4*RH+16,"text-anchor":"middle","font-family":mono,"font-size":11,"font-weight":600,fill:"var(--shield)"},"NOW");
    return res;
  }

  function renderClocks(box,res){
    var list=[
      {k:"Drive left",v:res.drive,max:11},
      {k:"Shift left",v:res.shift,max:14},
      {k:"Break in",v:res.brk,max:8},
      {k:"Cycle left",v:res.cycle,max:70}
    ];
    box.innerHTML="";
    list.forEach(function(c){
      var d=document.createElement("div");
      d.className="clock"+(c.v<=0?" out":c.v<=1?" low":"");
      var pct=Math.max(0,Math.min(100,c.v/c.max*100));
      d.innerHTML='<span class="k">'+c.k+'</span><span class="v">'+fmt(c.v)+'</span><span class="bar"><i style="width:'+pct+'%"></i></span>';
      box.appendChild(d);
    });
  }

  window.ELDTrack={fmt:fmt,calc:calc,drawGrid:drawGrid,renderClocks:renderClocks,ROWS:ROWS};
})();
