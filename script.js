document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "auth") initAuthPage();
  if (page === "main") initMainPage();
});

/* ======================================
      🔐 로그인 / 회원가입
====================================== */
function initAuthPage() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  const loginContainer = document.getElementById("login-container");
  const signupContainer = document.getElementById("signup-container");

  const goSignup = document.getElementById("go-signup");
  const goLogin = document.getElementById("go-login");

  const idInput = document.getElementById("signup-username");
  const pwInput = document.getElementById("signup-password");
  const pwConfirm = document.getElementById("signup-confirm");

  const checkBtn = document.getElementById("check-duplicate");
  const checkResult = document.getElementById("id-check-result");

  const pwLength = document.getElementById("pw-length");
  const pwAlpha  = document.getElementById("pw-alpha");
  const pwNumber = document.getElementById("pw-number");

  let idChecked = false;

  goSignup.onclick = () => {
    loginContainer.classList.add("hidden");
    signupContainer.classList.remove("hidden");
  };

  goLogin.onclick = () => {
    signupContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
  };

  /* 아이디 중복확인 */
  checkBtn.onclick = () => {
    const username = idInput.value.trim();

    if (!username) {
      checkResult.textContent = "아이디를 입력해주세요.";
      checkResult.style.color = "#e74c3c";
      idChecked = false;
      return;
    }

    if (localStorage.getItem("user_" + username)) {
      checkResult.textContent = "이미 존재하는 아이디입니다.";
      checkResult.style.color = "#e74c3c";
      idChecked = false;
    } else {
      checkResult.textContent = "사용 가능한 아이디입니다.";
      checkResult.style.color = "#2ecc71";
      idChecked = true;
    }
  };

  /* 비밀번호 규칙 실시간 체크 */
  pwInput.addEventListener("input", () => {
    const pw = pwInput.value;
    const hasAlpha = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const longEnough = pw.length >= 6;

    applyRuleStyle(pwLength, longEnough);
    applyRuleStyle(pwAlpha, hasAlpha);
    applyRuleStyle(pwNumber, hasNumber);
  });

  function applyRuleStyle(el, passed) {
    el.classList.remove("pass", "fail");
    el.classList.add(passed ? "pass" : "fail");
  }

  /* 회원가입 */
  signupForm.onsubmit = (e) => {
    e.preventDefault();

    const user = idInput.value.trim();
    const pw   = pwInput.value.trim();
    const cf   = pwConfirm.value.trim();

    if (!idChecked) {
      alert("아이디 중복확인을 해주세요.");
      return;
    }

    const pwRule = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!pwRule.test(pw)) {
      alert("비밀번호는 영어, 숫자를 포함하여 6자 이상이어야 합니다.");
      return;
    }

    if (pw !== cf) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    localStorage.setItem("user_" + user, pw);
    alert("회원가입이 완료되었습니다. 로그인해주세요.");

    signupContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
  };

  /* 로그인 */
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const pw = document.getElementById("login-password").value.trim();

    const saved = localStorage.getItem("user_" + username);

    if (saved === pw) {
      sessionStorage.setItem("currentUser", username);
      location.href = "main.html";
    } else {
      alert("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };
}

/* ======================================
                🌈 메인 페이지
====================================== */
function initMainPage() {
  const user = sessionStorage.getItem("currentUser");
  if (!user) return location.href = "index.html";

  document.getElementById("welcome-name").textContent = user + "님";

  document.getElementById("logout-btn").onclick = () => {
    if (confirm("정말 떠나시겠습니까?")) {
      sessionStorage.removeItem("currentUser");
      location.href = "index.html";
    }
  };

  let moods = JSON.parse(localStorage.getItem("moods_" + user) || "{}");
  let current = new Date();

  let selectedDate = null;
  let selectedEmotion = null;

  const calendar = document.getElementById("calendar");
  const emotionSection = document.getElementById("emotion-section");
  const memo = document.getElementById("memo");
  const deleteBtn = document.getElementById("delete-mood");
  const monthTitle = document.getElementById("month-title");

  const todoInput = document.getElementById("todo-input");
  const addTodoBtn = document.getElementById("add-todo");
  const todoListEl = document.getElementById("todo-list");

  const statsBtn = document.getElementById("show-stats");
  const statsSection = document.getElementById("stats-section");
  const moodAnalysis = document.getElementById("mood-analysis");

  /* 오버레이 */
  const overlay = document.getElementById("month-overlay");
  const overlayInner = document.getElementById("overlay-inner");
  const yearSelectView = document.getElementById("year-select-view");
  const monthSelectView = document.getElementById("month-select-view");
  const yearList = document.getElementById("year-list");
  const selectedYearTitle = document.getElementById("selected-year-title");
  const monthGrid = document.querySelector(".month-grid");
  const overlayClose = document.getElementById("overlay-close");
  const overlayClose2 = document.getElementById("overlay-close-2");
  const backToYearBtn = document.getElementById("back-to-year");

  const START_YEAR = 2025;
  const END_YEAR = 2070;
  let selectedYearForOverlay = current.getFullYear();

  function saveMoods() {
    localStorage.setItem("moods_" + user, JSON.stringify(moods));
  }

  /* 초기 렌더 */
  renderCalendar();

  /* 월 이동 */
  document.getElementById("prev-month").onclick = () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();
    autoUpdateStats();
    emotionSection.classList.add("hidden");
  };

  document.getElementById("next-month").onclick = () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();
    autoUpdateStats();
    emotionSection.classList.add("hidden");
  };

  /* 제목 클릭 → 연/월 선택 */
  monthTitle.onclick = () => openOverlay();

  function openOverlay() {
    overlay.classList.remove("hidden");
    yearSelectView.classList.remove("hidden");
    monthSelectView.classList.add("hidden");
  }

  overlayClose.onclick = () => overlay.classList.add("hidden");
  overlayClose2.onclick = () => overlay.classList.add("hidden");
  overlayInner.addEventListener("click", (e) => e.stopPropagation());
  overlay.addEventListener("click", () => overlay.classList.add("hidden"));

  /* 연도 버튼 생성 */
  yearList.innerHTML = "";
  for (let y = START_YEAR; y <= END_YEAR; y++) {
    const btn = document.createElement("button");
    btn.className = "year-btn";
    btn.textContent = y + "년";
    btn.onclick = () => {
      selectedYearForOverlay = y;
      showMonthSelectView();
    };
    yearList.appendChild(btn);
  }

  /* 월 버튼 생성 */
  monthGrid.innerHTML = "";
  for (let m = 1; m <= 12; m++) {
    const btn = document.createElement("button");
    btn.className = "month-select-btn";
    btn.textContent = m + "월";
    btn.onclick = () => {
      current = new Date(selectedYearForOverlay, m - 1, 1);
      renderCalendar();
      autoUpdateStats();
      overlay.classList.add("hidden");
      emotionSection.classList.add("hidden");
    };
    monthGrid.appendChild(btn);
  }

  function showMonthSelectView() {
    selectedYearTitle.textContent = `${selectedYearForOverlay}년`;
    yearSelectView.classList.add("hidden");
    monthSelectView.classList.remove("hidden");
  }

  backToYearBtn.onclick = () => {
    monthSelectView.classList.add("hidden");
    yearSelectView.classList.remove("hidden");
  };

  /* =======================
        달력 렌더링
  ======================= */
  function renderCalendar() {
    const y = current.getFullYear();
    const m = current.getMonth();
    const firstDay = new Date(y, m, 1).getDay();        // 0=일 ~ 6=토
    const lastDate = new Date(y, m + 1, 0).getDate();

    monthTitle.textContent = `${y}년 ${m + 1}월`;
    calendar.innerHTML = "";

    /* 앞쪽 빈 칸 (시작 요일 반영) */
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "calendar-day empty";
      calendar.appendChild(emptyCell);
    }

    /* 날짜 칸 */
    for (let d = 1; d <= lastDate; d++) {
      const dateKey = `${y}-${m + 1}-${d}`;
      const dayData = moods[dateKey] || {};
      const todos = Array.isArray(dayData.todos) ? dayData.todos : [];

      const cell = document.createElement("div");
      cell.className = "calendar-day";

      const num = document.createElement("div");
      num.className = "day-number";
      num.textContent = d;

      const memoText = document.createElement("div");
      memoText.className = "day-memo";
      memoText.textContent = dayData.memo ? dayData.memo.slice(0, 12) : "";

      const todosWrap = document.createElement("div");
      todosWrap.className = "day-todos";

      todos.forEach((todo, idx) => {
        if (idx >= 3) return;
        const span = document.createElement("span");
        span.className = "day-todo-item";
        if (todo.done) span.classList.add("done");
        span.textContent = todo.text;
        todosWrap.appendChild(span);
      });

      if (todos.length > 3) {
        const more = document.createElement("span");
        more.className = "day-todo-item";
        more.textContent = `+${todos.length - 3}개 더`;
        todosWrap.appendChild(more);
      }

      if (dayData.color) {
        cell.style.background = dayData.color;
        cell.style.color = "#fff";
      }

      cell.appendChild(num);
      cell.appendChild(memoText);
      cell.appendChild(todosWrap);

      cell.onclick = () => selectDate(dateKey, cell);

      calendar.appendChild(cell);
    }
  }

  /* 날짜 선택 */
  function selectDate(dateKey, cell) {
    document.querySelectorAll(".calendar-day")
      .forEach(d => d.classList.remove("selected-day"));
    if (!cell.classList.contains("empty")) {
      cell.classList.add("selected-day");
    }

    selectedDate = dateKey;
    emotionSection.classList.remove("hidden");

    const data = moods[dateKey];

    if (data) {
      memo.value = data.memo || "";
      selectedEmotion = data.emotion && data.color
        ? { emotion: data.emotion, color: data.color }
        : null;

      document.querySelectorAll(".emotion").forEach(btn => {
        btn.classList.remove("selected");
        btn.style.backgroundColor = "#f9fafb";
        btn.style.color = "#333";
        if (selectedEmotion && btn.dataset.emotion === selectedEmotion.emotion) {
          btn.classList.add("selected");
          btn.style.backgroundColor = selectedEmotion.color;
          btn.style.color = "#fff";
        }
      });

      deleteBtn.classList.remove("hidden");
    } else {
      memo.value = "";
      selectedEmotion = null;
      deleteBtn.classList.add("hidden");
      document.querySelectorAll(".emotion").forEach(btn => {
        btn.classList.remove("selected");
        btn.style.backgroundColor = "#f9fafb";
        btn.style.color = "#333";
      });
    }

    renderTodoList();
  }

  /* 감정 버튼 */
  document.querySelectorAll(".emotion").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".emotion").forEach(b => {
        b.classList.remove("selected");
        b.style.backgroundColor = "#f9fafb";
        b.style.color = "#333";
      });
      btn.classList.add("selected");
      btn.style.backgroundColor = btn.dataset.color;
      btn.style.color = "#fff";

      selectedEmotion = {
        emotion: btn.dataset.emotion,
        color: btn.dataset.color
      };
    };
  });

  /* =======================
        투두 리스트
  ======================= */
  function renderTodoList() {
    todoListEl.innerHTML = "";
    if (!selectedDate) return;

    const dayData = moods[selectedDate] || {};
    const todos = Array.isArray(dayData.todos) ? dayData.todos : [];

    todos.forEach((todo, index) => {
      const li = document.createElement("li");
      li.className = "todo-item";

      const completeBtn = document.createElement("button");
      completeBtn.className = "todo-complete-btn";
      completeBtn.textContent = todo.done ? "되돌리기" : "완료";

      const textSpan = document.createElement("span");
      textSpan.className = "todo-text";
      if (todo.done) textSpan.classList.add("done");
      textSpan.textContent = todo.text;

      const deleteBtnTodo = document.createElement("button");
      deleteBtnTodo.className = "todo-delete-btn";
      deleteBtnTodo.textContent = "삭제";

      completeBtn.onclick = () => {
        const d = moods[selectedDate] || {};
        if (!Array.isArray(d.todos)) d.todos = [];
        d.todos[index].done = !d.todos[index].done;
        moods[selectedDate] = d;
        saveMoods();
        renderTodoList();
        renderCalendar();
      };

      deleteBtnTodo.onclick = () => {
        const d = moods[selectedDate] || {};
        if (!Array.isArray(d.todos)) d.todos = [];
        d.todos.splice(index, 1);
        moods[selectedDate] = d;
        saveMoods();
        renderTodoList();
        renderCalendar();
      };

      li.appendChild(completeBtn);
      li.appendChild(textSpan);
      li.appendChild(deleteBtnTodo);
      todoListEl.appendChild(li);
    });
  }

  addTodoBtn.onclick = handleAddTodo;
  todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTodo();
    }
  });

  function handleAddTodo() {
    if (!selectedDate) {
      alert("먼저 날짜를 선택해주세요.");
      return;
    }
    const text = todoInput.value.trim();
    if (!text) return;

    const dayData = moods[selectedDate] || {};
    if (!Array.isArray(dayData.todos)) dayData.todos = [];
    dayData.todos.push({ text, done: false });
    moods[selectedDate] = dayData;

    saveMoods();
    todoInput.value = "";
    renderTodoList();
    renderCalendar();
  }

  /* =======================
        감정 저장 / 삭제
  ======================= */
  document.getElementById("save-mood").onclick = () => {
    if (!selectedDate || !selectedEmotion) {
      alert("날짜와 감정을 선택해주세요.");
      return;
    }

    const prev = moods[selectedDate] || {};
    moods[selectedDate] = {
      emotion: selectedEmotion.emotion,
      color: selectedEmotion.color,
      memo: memo.value,
      todos: Array.isArray(prev.todos) ? prev.todos : []
    };

    saveMoods();
    deleteBtn.classList.remove("hidden");
    renderCalendar();
    autoUpdateStats();
  };

  deleteBtn.onclick = () => {
    if (!selectedDate) return;
    if (!confirm("이 날짜의 기록을 모두 삭제할까요?")) return;

    delete moods[selectedDate];
    saveMoods();

    memo.value = "";
    selectedEmotion = null;
    deleteBtn.classList.add("hidden");
    document.querySelectorAll(".emotion").forEach(b => {
      b.classList.remove("selected");
      b.style.backgroundColor = "#f9fafb";
      b.style.color = "#333";
    });

    todoListEl.innerHTML = "";
    renderCalendar();
    autoUpdateStats();
  };

  /* =======================
        감정 통계
  ======================= */
  let chart = null;
  const chartCanvas = document.getElementById("moodChart");

  statsBtn.onclick = () => {
    statsSection.classList.toggle("hidden");
    if (!statsSection.classList.contains("hidden")) {
      renderMonthlyChart();
    }
  };

  function autoUpdateStats() {
    if (!statsSection.classList.contains("hidden")) {
      renderMonthlyChart();
    }
  }

  function renderMonthlyChart() {
    const y = current.getFullYear();
    const m = current.getMonth() + 1;

    const monthly = {};

    Object.keys(moods).forEach(dateKey => {
      const [yy, mm] = dateKey.split("-").map(Number);
      if (yy === y && mm === m) {
        const emotion = moods[dateKey].emotion;
        if (!emotion) return;
        monthly[emotion] = (monthly[emotion] || 0) + 1;
      }
    });

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: "pie",
      data: {
        labels: Object.keys(monthly),
        datasets: [{
          data: Object.values(monthly),
          backgroundColor: Object.keys(monthly).map(emotion => {
            const entry = Object.values(moods).find(v => v.emotion === emotion);
            return entry?.color || "#ccc";
          })
        }]
      }
    });

    if (Object.keys(monthly).length === 0) {
      moodAnalysis.textContent = "이번 달에는 감정 기록이 없어요.";
      return;
    }

    const values = Object.values(monthly);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    if (maxVal === minVal && values.length > 1) {
      moodAnalysis.textContent = "이번 달은 다양한 감정을 느꼈군요!";
      return;
    }

    const topEmotion = Object.entries(monthly).sort((a, b) => b[1] - a[1])[0][0];

    const messages = {
      "행복": "이번 달은 행복한 날들이 많았어요! 좋은 기운이 계속되길 바라요.",
      "평온": "이번 달은 평온한 시간이 많았네요. 편안한 한 달이었어요.",
      "우울": "이번 달은 우울한 감정이 많았어요. 다음 달엔 마음을 가볍게 해줄 활동을 해보는 건 어때요?",
      "분노": "이번 달은 스트레스가 많았던 것 같아요. 잠깐 쉬어가는 시간을 가져보는 것도 좋아요.",
      "피곤": "이번 달은 많이 지친 한 달이었어요. 충분한 휴식이 꼭 필요해 보여요."
    };

    moodAnalysis.textContent = messages[topEmotion] || "이번 달엔 여러 감정을 경험했어요.";
  }

  /* 감정창 외부 클릭 시 닫기 */
  document.addEventListener("click", (e) => {
    if (
      !emotionSection.classList.contains("hidden") &&
      !emotionSection.contains(e.target) &&
      !calendar.contains(e.target)
    ) {
      emotionSection.classList.add("hidden");
    }
  });
}
