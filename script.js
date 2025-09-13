// script.js - loads data/movies.json and renders index + film pages.
// Works for index.html and film.html. Filtering by genre supported.

async function fetchData() {
  const res = await fetch('data/movies.json');
  if (!res.ok) throw new Error('Gagal memuat data/movies.json');
  return res.json();
}

function slugify(s) {
  return s.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

function createCard(movie) {
  const a = document.createElement('a');
  a.href = 'film.html?id=' + movie.id;
  a.className = 'block rounded overflow-hidden bg-gray-800 hover:scale-105 transform transition';

  const img = document.createElement('img');
  img.src = movie.poster;
  img.alt = movie.title;
  img.loading = 'lazy';
  img.className = 'w-full h-64 object-cover';
  a.appendChild(img);

  const meta = document.createElement('div');
  meta.className = 'p-3';
  meta.innerHTML = `<h3 class="font-semibold">${movie.title}</h3>
                    <p class="text-sm text-gray-400">${movie.year || ''}</p>`;
  a.appendChild(meta);
  return a;
}

function renderGenres(genres, targetId='genres') {
  const container = document.getElementById(targetId);
  if(!container) return;
  container.innerHTML = '';
  genres.forEach(g => {
    const btn = document.createElement('button');
    btn.textContent = g;
    btn.className = 'px-3 py-1 bg-white/10 rounded ml-2 hover:bg-white/20';
    btn.addEventListener('click', ()=> {
      // navigate to index with ?genre=Name
      if (location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
        // on index - filter in place
        filterByGenre(g);
      } else {
        // go to index and apply filter via hash
        location.href = 'index.html?genre=' + encodeURIComponent(g);
      }
    });
    container.appendChild(btn);
  });
}

function filterByGenre(genre) {
  const grid = document.getElementById('grid');
  if(!grid) return;
  const cards = Array.from(grid.children);
  cards.forEach(card => {
    const gid = card.getAttribute('data-genres');
    const has = gid && gid.split('|').includes(genre);
    card.style.display = has ? '' : 'none';
  });
  // highlight active
  document.querySelectorAll('#genres button, #topGenres button').forEach(b=> {
    b.classList.remove('ring-2','ring-white');
    if (b.textContent === genre) b.classList.add('ring-2','ring-white');
  });
}

function buildIndex(movies) {
  const grid = document.getElementById('grid');
  const genresSet = new Set();
  grid.innerHTML = '';

  movies.forEach(m => {
    m.id = m.id || slugify(m.title);
    const wrapper = document.createElement('div');
    wrapper.className = '';
    wrapper.setAttribute('data-genres', (m.genres||[]).join('|'));
    const card = createCard(m);
    wrapper.appendChild(card);
    grid.appendChild(wrapper);
    (m.genres||[]).forEach(g=>genresSet.add(g));
  });

  const genres = Array.from(genresSet).sort();
  renderGenres(genres, 'genres');
  renderGenres(genres, 'topGenres');

  // handle ?genre= in URL
  const qp = new URLSearchParams(location.search);
  const qg = qp.get('genre');
  if (qg) filterByGenre(qg);

  // all button resets
  const allBtn = document.getElementById('allBtn');
  if (allBtn) allBtn.onclick = ()=> {
    Array.from(grid.children).forEach(c=> c.style.display = '');
    document.querySelectorAll('#genres button, #topGenres button').forEach(b=> b.classList.remove('ring-2','ring-white'));
  };
}

function buildDetail(movies) {
  const qp = new URLSearchParams(location.search);
  const id = qp.get('id');
  const el = document.getElementById('detail');
  if (!el) return;
  const movie = movies.find(m => (m.id === id) || (m.slug === id) );
  if (!movie) {
    el.innerHTML = '<p class="text-center text-gray-400">Film tidak ditemukan. <a href="index.html" class="text-blue-400">Kembali</a></p>';
    return;
  }
  el.innerHTML = `
    <div class="md:flex gap-6">
      <div class="md:w-1/3">
        <img src="${movie.poster}" alt="${movie.title}" class="w-full object-cover rounded" />
      </div>
      <div class="md:flex-1">
        <h2 class="text-2xl font-bold">${movie.title}</h2>
        <p class="text-sm text-gray-400 mb-2">${movie.year || ''} • ${ (movie.genres||[]).join(', ') }</p>
        <p class="mb-4 text-gray-200">${movie.description || ''}</p>
        ${ movie.trailer ? `<p class="mb-2"><a href="${movie.trailer}" target="_blank" class="underline">Tonton Trailer / Link</a></p>` : '' }
        <p class="mt-4"><a href="index.html" class="px-4 py-2 bg-indigo-600 rounded inline-block">Kembali</a></p>
      </div>
    </div>
    `;
}

(async function main(){
  try {
    const movies = await fetchData();
    if (document.getElementById('grid')) {
      buildIndex(movies);
    } else if (document.getElementById('detail')) {
      buildDetail(movies);
    }
  } catch (e) {
    console.error(e);
    const err = document.createElement('pre');
    err.textContent = String(e);
    document.body.appendChild(err);
  }
})();