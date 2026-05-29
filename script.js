document.addEventListener('DOMContentLoaded', ()=>{
  const navToggle = document.getElementById('navToggle');
  const navList = document.querySelector('.nav-list');
  if(navToggle){
    navToggle.addEventListener('click', ()=>{
      navList?.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
  }

  // Smooth internal links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        e.preventDefault();
        const el = document.querySelector(href);
        el?.scrollIntoView({behavior:'smooth',block:'start'});
      }
    });
  });

  // Simple contact form handler
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = new FormData(form);
    // Replace with real submit in production
    alert('Thanks — message sent (demo).');
    form.reset();
  });
  
  // Parallax / tilt effects
  const root = document.documentElement;
  let mouseX = 0, mouseY = 0, raf = null;

  function onMove(e){
    const nx = (e.clientX / window.innerWidth) - 0.5; // -0.5 .. 0.5
    const ny = (e.clientY / window.innerHeight) - 0.5;
    mouseX = nx;
    mouseY = ny;
    if(!raf) raf = requestAnimationFrame(updateRoot);
  }

  function updateRoot(){
    raf = null;
    const mx = (mouseX * 18).toFixed(2) + 'px';
    const my = (mouseY * 12).toFixed(2) + 'px';
    root.style.setProperty('--mx', mx);
    root.style.setProperty('--my', my);

    // update per-card tilt
    document.querySelectorAll('.project-card').forEach(card=>{
      const r = card.getBoundingClientRect();
      const cx = (r.left + r.width/2);
      const cy = (r.top + r.height/2);
      const rx = -((mouseY) * 6).toFixed(2) + 'deg';
      const ry = ((mouseX) * 6).toFixed(2) + 'deg';
      card.style.setProperty('--rx', rx);
      card.style.setProperty('--ry', ry);
      const cmx = ((mouseX) * 10).toFixed(2) + 'px';
      const cmy = ((mouseY) * 6).toFixed(2) + 'px';
      card.style.setProperty('--mx', cmx);
      card.style.setProperty('--my', cmy);
    });
  }

  // subtle hero offset
  const hero = document.querySelector('.hero');
  if(hero){
    document.addEventListener('mousemove', onMove);
    hero.addEventListener('mouseenter', ()=>hero.classList.add('active'));
    hero.addEventListener('mouseleave', ()=>{
      hero.classList.remove('active');
      root.style.setProperty('--mx','0px');
      root.style.setProperty('--my','0px');
    });
  }

  // per-card pointer interactions
  document.querySelectorAll('.project-card').forEach(card=>{
    card.addEventListener('mouseenter', ()=>card.classList.add('hover'));
    card.addEventListener('mouseleave', ()=>{
      card.classList.remove('hover');
      card.style.setProperty('--mx','0px');
      card.style.setProperty('--my','0px');
      card.style.setProperty('--rx','0deg');
      card.style.setProperty('--ry','0deg');
    });
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = (-py * 8).toFixed(2) + 'deg';
      const ry = (px * 8).toFixed(2) + 'deg';
      const cx = (px * 14).toFixed(2) + 'px';
      const cy = (py * 10).toFixed(2) + 'px';
      card.style.setProperty('--rx', rx);
      card.style.setProperty('--ry', ry);
      card.style.setProperty('--mx', cx);
      card.style.setProperty('--my', cy);
    });
  });
});
