const formEl = document.getElementById('form');
const searchInputEl = document.getElementById('search');
const resultEl = document.querySelector('.results');
const errorEl = document.querySelector('.error-block');

const STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

let state = {
  search: '',
  status: STATUS.IDLE,
  meanings: [],
  phonetics: [],
  error: '',
};

const addEventForSound = () => {
  const soundEl = [...document.querySelectorAll('.audio')];
  soundEl.forEach(elem => {
    elem.addEventListener('click', handleSound);
  });
};
const removeEventForSound = () => {
  const soundEl = [...document.querySelectorAll('.audio')];

  soundEl.forEach(elem => {
    elem.removeEventListener('click', handleSound);
  });
};
async function fetchData(searchWord) {
  state.status = STATUS.PENDING;
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${searchWord}`,
  );

  if (response.ok && response.status === 200) {
    const data = await response.json();

    const meanings = data.reduce((acc, item) => {
      return [...acc, ...item.meanings];
    }, []);

    state = { ...state, meanings: meanings, phonetics: data[0].phonetics };
    state.status = STATUS.RESOLVED;
    console.log(state);
    return;
  } else {
    state.error = response.status;
    state.status = STATUS.REJECTED;
  }
}

function createMarkup(phonetics, searchWord) {
  return phonetics
    .map(item => {
      if (item.audio.includes('au.mp3') || !item.audio) {
        return;
      }
      const transcription = item.text.slice(1, item.text.length - 1);
      const languageURL = item.audio.includes('uk.mp3')
        ? './img/uk.png'
        : './img/usa.png';
      return `<li class="item"> <div class="text-wrap"><img class="flag" src="${languageURL}">
        <p class="word">${searchWord}</p>
        <p class="phonetics-text">${transcription}</p>
      </div>
      <button class="audio">
        <img
          class="audio-icon"
          src="./img/icon-audio.png"
          alt="audio"
          width="30"
					data-sound="${item.audio}"
        />
      </button></li>`;
    })
    .join('');
}

function renderMarkup(phonetics, searchWord) {
  resultEl.innerHTML = createMarkup(phonetics, searchWord);
}

const handleChangeInput = e => {
  state.search = e.target.value;
};

async function handleSubmit(e) {
  e.preventDefault();
  resultEl.innerHTML = '';
  removeEventForSound();
  if (state.search.trim().length) {
    await fetchData(state.search).then(() => {
      if (state.status === STATUS.PENDING) {
        resultEl.innerHTML = 'Waiting...';
      }
      if (state.status === STATUS.RESOLVED) {
        console.log(state.phonetics);
        renderMarkup(state.phonetics, state.search);
        addEventForSound();
      }
      if (state.status === STATUS.REJECTED) {
        if (state.error === 404) {
          errorEl.style.display = 'block';
        }
      }
      if (state.status !== STATUS.REJECTED) {
        errorEl.style.display = 'none';
      }
    });
  }
}

function handleSound(e) {
  const soundURL = e.target.dataset.sound;
  if (soundURL) {
    new Audio(soundURL).play();
  }
}

formEl.addEventListener('submit', handleSubmit);
searchInputEl.addEventListener('input', handleChangeInput);
