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
});
