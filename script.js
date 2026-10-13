// -----------------------------------------------------------------
// Santri VIP - Interactive Engine & Content Hydration
// Zero emoticons / Zero emojis
// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initMenuAndNavigation();
  initThemeSwitcher();
  initCopyEmail();
  initSocialPreview();
  hydrateContentFromJSON();
});

// Menu Drawer & Navigation
function initMenuAndNavigation() {
  const menu = document.getElementById('menu');
  if (!menu) return;

  const topBar = menu.querySelector(':scope > div:first-child');
  const drawer = menu.querySelector(':scope > div:nth-child(2)');
  if (!topBar || !drawer) return;

  topBar.style.cursor = 'pointer';

  let isOpen = false;

  function setOpen(open) {
    isOpen = open;
    if (isOpen) {
      drawer.classList.remove('grid-rows-[0fr]', 'opacity-0');
      drawer.classList.add('grid-rows-[1fr]', 'opacity-100');
    } else {
      drawer.classList.remove('grid-rows-[1fr]', 'opacity-100');
      drawer.classList.add('grid-rows-[0fr]', 'opacity-0');
    }
  }

  topBar.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!isOpen);
  });

  // Keyboard shortcut Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen(!isOpen);
    } else if (e.key === 'Escape' && isOpen) {
      setOpen(false);
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isOpen && !menu.contains(e.target)) {
      setOpen(false);
    }
  });

  // Section buttons in drawer
  const sectionButtons = drawer.querySelectorAll('button');
  const sectionMap = {
    0: 'hero',        // Home
    1: 'experience',  // Experience
    2: 'projects',    // Open-Source
    3: 'stack'        // Tech Stack
  };

  Object.entries(sectionMap).forEach(([idx, id]) => {
    const btn = sectionButtons[parseInt(idx, 10)];
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
        setOpen(false);
      });
    }
  });
}

// Theme Switcher (Light / Dark / System)
function initThemeSwitcher() {
  const menu = document.getElementById('menu');
  if (!menu) return;

  const drawer = menu.querySelector(':scope > div:nth-child(2)');
  if (!drawer) return;

  const buttons = drawer.querySelectorAll('button');
  // Buttons index 4: Light, 5: Dark, 6: System
  const themeButtons = {
    light: buttons[4],
    dark: buttons[5],
    system: buttons[6]
  };

  function getCurrentTheme() {
    return localStorage.getItem('theme') || 'system';
  }

  function applyTheme(theme) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      html.classList.remove('dark');
    } else {
      // System mode
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', isDark);
    }

    // Update active outline indicator
    Object.entries(themeButtons).forEach(([key, btn]) => {
      if (!btn) return;
      if (key === theme) {
        btn.classList.add('outline-border', 'outline');
      } else {
        btn.classList.remove('outline-border', 'outline');
      }
    });
  }

  // Bind clicks
  Object.entries(themeButtons).forEach(([key, btn]) => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('theme', key);
      applyTheme(key);
    });
  });

  // Watch system changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (getCurrentTheme() === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  });

  // Initial apply
  applyTheme(getCurrentTheme());
}

// Copy Email Button
let userEmailAddress = 'hello@example.com';

function initCopyEmail() {
  const copyBtn = document.querySelector('button.squircle.px-4.py-2');
  if (!copyBtn) return;

  const spans = copyBtn.querySelectorAll('span');
  if (spans.length < 2) return;

  const defaultSpan = spans[0];
  const copiedSpan = spans[1];
  let timer = null;

  copyBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(userEmailAddress);
      } else {
        const ta = document.createElement('textarea');
        ta.value = userEmailAddress;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      defaultSpan.classList.add('opacity-0', 'blur-xs');
      copiedSpan.classList.remove('opacity-0', 'blur-xs');

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        defaultSpan.classList.remove('opacity-0', 'blur-xs');
        copiedSpan.classList.add('opacity-0', 'blur-xs');
      }, 2500);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  });
}

// Social Links Contribution Preview Card
function initSocialPreview() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const githubLink = hero.querySelector('a[aria-label="GitHub"]');
  const previewCard = hero.querySelector('.squircle-sm.shadow-2xl');
  if (!githubLink || !previewCard) return;

  function showCard() {
    previewCard.style.width = '352px';
    previewCard.style.height = '148px';
    previewCard.style.left = '20px';
    previewCard.classList.remove('pointer-events-none', 'opacity-0', 'scale-[0.97]', 'translate-y-1');
    previewCard.classList.add('pointer-events-auto', 'opacity-100', 'scale-100', 'translate-y-0');
  }

  function hideCard() {
    previewCard.classList.remove('pointer-events-auto', 'opacity-100', 'scale-100', 'translate-y-0');
    previewCard.classList.add('pointer-events-none', 'opacity-0', 'scale-[0.97]', 'translate-y-1');
    previewCard.style.width = '0';
    previewCard.style.height = '0';
  }

  if (!githubLink._previewBound) {
    githubLink._previewBound = true;
    githubLink.addEventListener('mouseenter', showCard);
    githubLink.addEventListener('focus', showCard);
    githubLink.addEventListener('mouseleave', hideCard);
    githubLink.addEventListener('blur', hideCard);
  }

  if (!previewCard._previewBound) {
    previewCard._previewBound = true;
    previewCard.addEventListener('mouseenter', showCard);
    previewCard.addEventListener('mouseleave', hideCard);
  }
}

// Hydrate Content from content.json
async function hydrateContentFromJSON() {
  try {
    const res = await fetch('/content.json?v=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();

    // 1. Email
    if (data.email) {
      userEmailAddress = data.email;
    }

    // 2. Avatar
    if (data.avatar) {
      document.querySelectorAll('img[src*="avatar"]').forEach(img => {
        img.src = '/' + data.avatar;
      });
    }

    // 3. Name & Role
    if (data.name) {
      const menuName = document.querySelector('#menu .flex-col span:first-child');
      if (menuName) menuName.textContent = data.name;

      const heroName = document.querySelector('#hero h1');
      if (heroName) heroName.textContent = data.name;

      document.title = data.name + (data.role ? ' • ' + data.role : '');
    }

    if (data.role) {
      const menuRole = document.querySelector('#menu .flex-col span.text-muted span.absolute');
      if (menuRole) menuRole.textContent = data.role;
    }

    // 4. Bio Paragraphs
    if (data.bio_paragraphs && data.bio_paragraphs.length > 0) {
      const bioDiv = document.querySelector('#hero .text-muted\\/90');
      if (bioDiv) {
        bioDiv.innerHTML = data.bio_paragraphs.map(p => `<p><span>${p}</span></p>`).join('');
      }
    }

    // 5. Social URLs & Dynamic Social Links
    if (data.social_links && Array.isArray(data.social_links) && data.social_links.length > 0) {
      const socialContainer = document.getElementById('hero-social-links') || document.querySelector('#hero .flex.items-center.gap-2 > .relative.flex');
      if (socialContainer) {
        const previewCard = socialContainer.querySelector('.squircle-sm.shadow-2xl');
        socialContainer.querySelectorAll('a').forEach(a => a.remove());

        data.social_links.forEach(item => {
          if (item.visible === false || !item.url) return;
          const a = document.createElement('a');
          a.setAttribute('aria-label', item.platform || 'Social');
          a.className = 'hover:[&_path]:fill-fg [&_path]:fill-muted hover:text-fg text-muted z-10 p-2 transition-colors flex items-center justify-center';
          a.href = item.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';

          const icon = (item.icon || '').trim();
          if (icon.startsWith('fa-')) {
            a.innerHTML = `<i class="${icon} size-6 text-xl flex items-center justify-center"></i>`;
          } else if (icon.includes('<svg')) {
            const temp = document.createElement('div');
            temp.innerHTML = icon;
            const svg = temp.querySelector('svg');
            if (svg) {
              svg.setAttribute('class', 'size-6 [&_path]:fill-current');
              svg.setAttribute('aria-hidden', 'true');
              a.appendChild(svg);
            }
          } else {
            a.innerHTML = `<i class="fa-solid fa-link size-6 text-xl flex items-center justify-center"></i>`;
          }

          if (previewCard) {
            socialContainer.insertBefore(a, previewCard);
          } else {
            socialContainer.appendChild(a);
          }
        });

        // Initialize preview card if GitHub is rendered
        initSocialPreview();
      }
    } else {
      if (data.github_url) {
        const gh = document.querySelector('a[aria-label="GitHub"]');
        if (gh) gh.href = data.github_url;
      }
      if (data.linkedin_url) {
        const li = document.querySelector('a[aria-label="LinkedIn"]');
        if (li) li.href = data.linkedin_url;
      }
      if (data.x_url) {
        const x = document.querySelector('a[aria-label="X"]');
        if (x) x.href = data.x_url;
      }
    }

    // 6. Section Visibility Toggles (Content & Top Navigation Menu Items)
    const getMenuBtn = (sec) => {
      const byData = document.querySelector(`#menu button[data-section="${sec}"]`);
      if (byData) return byData;
      const allButtons = Array.from(document.querySelectorAll('#menu button'));
      if (sec === 'experience') return allButtons.find(b => b.textContent.includes('Experience'));
      if (sec === 'projects') return allButtons.find(b => b.textContent.includes('Open-Source') || b.textContent.includes('Projects'));
      if (sec === 'stack') return allButtons.find(b => b.textContent.includes('Tech Stack') || b.textContent.includes('Stack'));
      return null;
    };

    const expBtn = getMenuBtn('experience');
    const projBtn = getMenuBtn('projects');
    const stackBtn = getMenuBtn('stack');

    const showExp = data.show_experience !== false;
    const expSec = document.getElementById('experience');
    if (expSec) {
      expSec.style.display = showExp ? '' : 'none';
      if (expSec.previousElementSibling && expSec.previousElementSibling.tagName === 'HR') {
        expSec.previousElementSibling.style.display = showExp ? '' : 'none';
      }
    }
    if (expBtn) expBtn.style.display = showExp ? '' : 'none';

    const showProj = data.show_projects !== false;
    const projSec = document.getElementById('projects');
    if (projSec) {
      projSec.style.display = showProj ? '' : 'none';
      if (projSec.previousElementSibling && projSec.previousElementSibling.tagName === 'HR') {
        projSec.previousElementSibling.style.display = showProj ? '' : 'none';
      }
    }
    if (projBtn) projBtn.style.display = showProj ? '' : 'none';

    const showStack = data.show_stack !== false;
    const stackSec = document.getElementById('stack');
    if (stackSec) {
      stackSec.style.display = showStack ? '' : 'none';
      if (stackSec.previousElementSibling && stackSec.previousElementSibling.tagName === 'HR') {
        stackSec.previousElementSibling.style.display = showStack ? '' : 'none';
      }
    }
    if (stackBtn) stackBtn.style.display = showStack ? '' : 'none';

    // Editable Section Icons (Next to Section Titles & in Dock Menu)
    if (data.section_icons) {
      const applySectionIcon = (secId, iconVal) => {
        if (!iconVal) return;
        const sec = document.getElementById(secId);
        if (sec) {
          const headerBox = sec.querySelector(':scope > div:first-child');
          if (headerBox) {
            const oldIcon = headerBox.querySelector('svg, i');
            if (oldIcon) {
              if (iconVal.startsWith('fa-')) {
                const newI = document.createElement('i');
                newI.className = `${iconVal} bold-icon size-6 text-xl flex items-center justify-center`;
                oldIcon.replaceWith(newI);
              } else if (iconVal.includes('<svg')) {
                const temp = document.createElement('div');
                temp.innerHTML = iconVal;
                const newSvg = temp.querySelector('svg');
                if (newSvg) {
                  newSvg.setAttribute('class', 'bold-icon size-6');
                  newSvg.setAttribute('aria-hidden', 'true');
                  oldIcon.replaceWith(newSvg);
                }
              }
            }
          }
        }

        // Also update icon in top navigation menu item
        const menuBtn = getMenuBtn(secId);
        if (menuBtn && iconVal.startsWith('fa-')) {
          const oldMenuIcon = menuBtn.querySelector('svg, i');
          if (oldMenuIcon) {
            const newMenuI = document.createElement('i');
            newMenuI.className = `${iconVal} size-6 flex items-center justify-center text-lg`;
            oldMenuIcon.replaceWith(newMenuI);
          }
        }
      };

      if (data.section_icons.experience) applySectionIcon('experience', data.section_icons.experience);
      if (data.section_icons.projects) applySectionIcon('projects', data.section_icons.projects);
      if (data.section_icons.stack) applySectionIcon('stack', data.section_icons.stack);
    }

    // 2. Favicon
    if (data.favicon) {
      const fav = document.querySelector('link[rel="icon"]');
      if (fav) fav.href = '/' + data.favicon.replace(/^\//, '');
    }

    // 7. Tech Stack Items Visibility, Custom SVG, and Font Awesome Icons
    if (data.tech_stack && data.tech_stack.length > 0) {
      const stackList = document.querySelector('#stack ul');
      const stackMap = {};
      const handledNames = new Set();

      data.tech_stack.forEach(t => {
        stackMap[t.name.toLowerCase()] = t;
      });

      if (stackList) {
        const stackItems = stackList.querySelectorAll('li');
        stackItems.forEach(li => {
          const span = li.querySelector('span');
          const text = (span ? span.textContent : li.textContent || '').trim().toLowerCase();
          const conf = stackMap[text];
          if (conf) {
            handledNames.add(text);
            li.style.display = conf.visible === false ? 'none' : '';

            // Font Awesome Icon
            const faClass = conf.icon_class || (conf.custom_svg && conf.custom_svg.startsWith('fa-') ? conf.custom_svg : '');
            if (faClass) {
              const oldIcon = li.querySelector('svg, i');
              const newIcon = document.createElement('i');
              newIcon.className = `${faClass} size-10 flex items-center justify-center text-3xl transition-all group-hover:grayscale group-hover/item:grayscale-0!`;
              newIcon.style.fontSize = '2.25rem';
              if (oldIcon) oldIcon.replaceWith(newIcon);
            } else if (conf.custom_svg && conf.custom_svg.trim() && conf.custom_svg.includes('<svg')) {
              const svgOld = li.querySelector('svg, i');
              if (svgOld) {
                const temp = document.createElement('div');
                temp.innerHTML = conf.custom_svg;
                const newSvg = temp.querySelector('svg');
                if (newSvg) {
                  newSvg.setAttribute('class', 'size-10 transition-all group-hover:grayscale group-hover/item:grayscale-0!');
                  newSvg.setAttribute('aria-hidden', 'true');
                  svgOld.replaceWith(newSvg);
                }
              }
            }
          }
        });

        // Add newly created tech stack items that weren't in the HTML template
        data.tech_stack.forEach(t => {
          const key = t.name.toLowerCase();
          if (!handledNames.has(key) && t.visible !== false) {
            const newLi = document.createElement('li');
            newLi.className = 'group/item flex aspect-square flex-col items-center justify-center gap-3 hover:[&_i]:scale-108 hover:[&_svg]:scale-108';

            const faClass = t.icon_class || (t.custom_svg && t.custom_svg.startsWith('fa-') ? t.custom_svg : '');
            let iconHtml = '';
            if (faClass) {
              iconHtml = `<i class="${faClass} size-10 flex items-center justify-center text-3xl transition-all group-hover:grayscale group-hover/item:grayscale-0!" style="font-size: 2.25rem;"></i>`;
            } else if (t.custom_svg && t.custom_svg.includes('<svg')) {
              const temp = document.createElement('div');
              temp.innerHTML = t.custom_svg;
              const newSvg = temp.querySelector('svg');
              if (newSvg) {
                newSvg.setAttribute('class', 'size-10 transition-all group-hover:grayscale group-hover/item:grayscale-0!');
                newSvg.setAttribute('aria-hidden', 'true');
                iconHtml = temp.innerHTML;
              } else {
                iconHtml = t.custom_svg;
              }
            } else {
              iconHtml = `<i class="fa-solid fa-code size-10 flex items-center justify-center text-3xl transition-all group-hover:grayscale group-hover/item:grayscale-0!" style="font-size: 2.25rem;"></i>`;
            }

            newLi.innerHTML = `
              ${iconHtml}
              <span class="text-muted text-xs">${t.name}</span>
            `;
            stackList.appendChild(newLi);
          }
        });
      }
    }

    // 8. Footer
    if (data.footer) {
      const footer = document.querySelector('footer');
      if (footer) footer.textContent = data.footer;
    }

  } catch (err) {
    console.warn('Hydration skipped:', err);
  }
}
