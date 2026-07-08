/* Valore Property Holdings — shared site behaviour */
(function(){
  var yr=document.getElementById("yr"); if(yr) yr.textContent=new Date().getFullYear();

  /* sticky header + hero parallax */
  var hdr=document.getElementById("hdr");
  var art=document.getElementById("heroart");
  function onScroll(){
    if(hdr) hdr.classList.toggle("scrolled", window.scrollY>12);
    if(art){ var y=Math.min(window.scrollY*0.05,36); art.style.transform="translateY("+(-y)+"px)"; }
  }
  window.addEventListener("scroll",onScroll,{passive:true}); onScroll();

  /* mobile nav */
  var burger=document.getElementById("burger"), mob=document.getElementById("mobnav");
  if(burger&&mob){ burger.addEventListener("click",function(){ mob.classList.toggle("open"); });
    mob.addEventListener("click",function(e){ if(e.target.tagName==="A") mob.classList.remove("open"); }); }

  /* reveal on scroll */
  var els=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }); },
      {threshold:0.12,rootMargin:"0px 0px -7% 0px"});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add("in"); }); }
  /* hero reveals immediately, staggered */
  window.addEventListener("load",function(){
    document.querySelectorAll(".hero .reveal, .phero .reveal, .hero-video .reveal").forEach(function(el,i){ setTimeout(function(){ el.classList.add("in"); },70+i*85); });
  });

  /* contact form (only present on contact page) */
  var seg=document.getElementById("seg");
  var audience="landlord";
  var EXTRA={landlord:"Property location / postcode",investor:"Investment budget / interest",provider:"Areas & stock you need"};
  window.setAudience=function(a){ audience=a;
    if(seg) seg.querySelectorAll("button").forEach(function(x){ x.classList.toggle("active",x.dataset.a===a); });
    var el=document.getElementById("lf_extraLabel"); if(el) el.textContent=EXTRA[a];
  };
  if(seg){ seg.addEventListener("click",function(e){ var b=e.target.closest("button"); if(b) window.setAudience(b.dataset.a); }); }
  /* preselect audience from URL ?for=investor */
  var m=location.search.match(/[?&]for=(landlord|investor|provider)/); if(m) window.setAudience(m[1]);

  var form=document.getElementById("leadForm");
  if(form){ form.addEventListener("submit",function(ev){ ev.preventDefault();
    function v(id){ var e=document.getElementById(id); return e?(e.value||"").trim():""; }
    var role={landlord:"Landlord",investor:"Investor",provider:"Provider"}[audience];
    var subject="Valore enquiry — "+role+": "+v("lf_name");
    var body="New "+role+" enquiry from the Valore website%0D%0A%0D%0AName: "+v("lf_name")+
      "%0D%0AEmail: "+v("lf_email")+"%0D%0APhone: "+v("lf_phone")+"%0D%0A"+EXTRA[audience]+": "+v("lf_extra")+
      "%0D%0A%0D%0AMessage:%0D%0A"+v("lf_msg");
    window.location.href="mailto:enquiries@valorepholdings.com?subject="+encodeURIComponent(subject)+"&body="+body;
  }); }
})();
