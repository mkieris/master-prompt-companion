// LOVABLE PROMPT TESTER - Kopiere alles und füge es in die Browser-Konsole ein
(async()=>{
  const V=['v0-pre-alpha-experimental','v1-kompakt-seo','v2-marketing-first','v3-hybrid-intelligent',
    'v5-ai-meta-optimiert','v6-quality-auditor','v7-seo-content-master','v8-natural-seo',
    'v9-master-prompt','v10-geo-optimized'];
  const T={focusKeyword:'Kinesiologie Tape',secondaryKeywords:['Sporttape','Muskeltape'],
    brandName:'K-Active',targetAudience:'end_customers',formOfAddress:'du',tone:'advisory',
    contentLength:'medium',keywordDensity:'normal',pageType:'product',pageGoal:'inform',includeFAQ:true};
  const F=['in der heutigen','es ist wichtig','zusammenfassend','tauchen wir','wie wir alle wissen'];
  const k=localStorage.getItem('sb-glwzxsqacxzhejytsvzl-auth-token');
  if(!k){console.error('❌ Nicht eingeloggt!');return;}
  const{access_token:t}=JSON.parse(k);
  console.log('🚀 Teste',V.length,'Prompt-Versionen...\n');
  const R=[];
  for(const v of V){
    console.log(`Testing ${v}...`);
    try{
      const r=await fetch('https://glwzxsqacxzhejytsvzl.supabase.co/functions/v1/generate-seo-content',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`,
          apikey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsd3p4c3FhY3h6aGVqeXRzdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjIwMjUsImV4cCI6MjA3ODE5ODAyNX0.czTSCOGL5d0FfBjMrn1zVN7flT0z-YABH_aPrgyKjSQ'},
        body:JSON.stringify({...T,promptVersion:v})});
      if(!r.ok){R.push({v,ok:false,err:`HTTP ${r.status}`});continue;}
      const d=await r.json(),c=d.variants?d.variants[0]:d,s=c.seoText||'';
      const p=s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
      const w=p.split(' ').filter(x=>x).length;
      const kw=(p.match(/Kinesiologie Tape/gi)||[]).length;
      const h1=(s.match(/<h1/gi)||[]).length;
      const h2=(s.match(/<h2/gi)||[]).length;
      const fl=F.filter(f=>p.toLowerCase().includes(f));
      const fq=c.faq?.length||0;
      let sc=0;
      if(h1===1)sc+=20;if(kw>=3&&kw<=15)sc+=15;if(w>=600&&w<=1200)sc+=15;
      if(h2>=3&&h2<=8)sc+=15;if(!fl.length)sc+=15;if(fq>=5)sc+=10;
      const dn=w>0?(kw/w*100):0;if(dn>=0.5&&dn<=2)sc+=10;
      R.push({v,ok:true,sc,w,kw,dn:dn.toFixed(2)+'%',h1,h2,fq,fl,txt:p.slice(0,150)+'...'});
      console.log(`✅ ${v}: ${sc}/100 | ${w} Wörter`);
    }catch(e){R.push({v,ok:false,err:e.message});}
    await new Promise(r=>setTimeout(r,3000));
  }
  console.log('\n📊 ERGEBNISSE:\n');
  console.table(R.filter(r=>r.ok).sort((a,b)=>b.sc-a.sc).map((r,i)=>({
    Rang:i+1,Version:r.v,Score:r.sc+'/100',Wörter:r.w,Keywords:r.kw,Dichte:r.dn,
    'H1/H2':`${r.h1}/${r.h2}`,FAQ:r.fq,Fluff:r.fl.length?'⚠️':'✅'})));
  window.testResults=R;
  console.log('\n💾 Ergebnisse in window.testResults gespeichert');
  const b=new Blob([JSON.stringify(R,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download='prompt-results.json';a.click();
})();
