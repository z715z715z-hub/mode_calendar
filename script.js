document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "auth") initAuth();
  if (page === "main") initMain();
});

/* ================================
   로그인 / 회원가입
================================ */
function initAuth() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  const loginContainer = document.getElementById("login-container");
  const signupContainer = document.getElementById("signup-container");

  const goSignup = document.getElementById("go-signup");
  const goLogin = document.getElementById("go-login");

  const idInput = document.getElementById("signup-username");
  const pwInput = document.getElementById("signup-password");
  const pwConfirm = document.getElementById("signup-confirm");

  const duplicateBtn = document.getElementById("check-duplicate");
  const duplicateMsg = document.getElementById("id-check-result");

  const ruleLen = document.getElementById("pw-length");
  const ruleAlpha = document.getElementById("pw-alpha");
  const ruleNum = document.getElementById("pw-number");

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
  duplicateBtn.onclick = () => {
    const id = idInput.value.trim();
    if (!id) {
      duplicateMsg.textContent = "아이디를 입력하세요.";
      duplicateMsg.style.color = "#e74c3c";
      idChecked = false;
      return;
    }

    if (localStorage.getItem("user_" + id)) {
      duplicateMsg.textContent = "이미 존재하는 아이디입니다.";
      duplicateMsg.style.color = "#e74c3c";
      idChecked = false;
    } else {
      duplicateMsg.textContent = "사용 가능한 아이디입니다.";
      duplicateMsg.style.color = "#2ecc71";
      idChecked = true;
    }
  };

  /* 비밀번호 규칙 실시간 표시 */
  pwInput.addEventListener("input", () => {
    const pw = pwInput.value;
    apply(ruleLen, pw.length >= 6);
    apply(ruleAlpha, /[A-Za-z]/.test(pw));
    apply(ruleNum, /\d/.test(pw));
  });

  function apply(el, ok) {
    el.classList.remove("pass", "fail");
    el.classList.add(ok ? "pass" : "fail");
  }

  /* 회원가입 */
  signupForm.onsubmit = (e) => {
    e.preventDefault();
    const id = idInput.value.trim();
    const pw = pwInput.value.trim();
    const cf = pwConfirm.value.trim();

    if (!idChecked) {
      alert("아이디 중복확인을 해주세요.");
      return;
    }

    const rule = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!rule.test(pw)) {
      alert("비밀번호 규칙을 확인해 주세요.");
      return;
    }

    if (pw !== cf) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    localStorage.setItem("user_" + id, pw);
    alert("회원가입이 완료되었습니다.");

    signupContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
  };

  /* 로그인 */
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById("login-username").value.trim();
    const pw = document.getElementById("login-password").value.trim();

    const saved = localStorage.getItem("user_" + id);
    if (saved === pw) {
      sessionStorage.setItem("currentUser", id);
      location.href = "main.html";
    } else {
      alert("아이디 또는 비밀번호가 틀렸습니다.");
    }
  };
}

/* ================================
   메인 페이지
================================ */
function initMain() {
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
  const memo = document.getElementById("memo");
  const deleteBtn = document.getElementById("delete-mood");
  const emotionSection = document.getElementById("emotion-section");
  const monthTitle = document.getElementById("month-title");

  /* 투두 */
  const todoInput = document.getElementById("todo-input");
  const todoList = document.getElementById("todo-list");

  /* 감정 선택 버튼 색상 수정 */
  document.querySelectorAll(".emotion").forEach(btn => {
    if (btn.dataset.emotion === "우울") btn.dataset.color = "#87CEFA";
    if (btn.dataset.emotion === "평온") btn.dataset.color = "#66BB6A";
  });

  /* 월 이동 */
  document.getElementById("prev-month").onclick = () => changeMonth(-1);
  document.getElementById("next-month").onclick = () => changeMonth(1);

  function changeMonth(diff) {
    current.setMonth(current.getMonth() + diff);
    renderCalendar();
  }

  /* 요일 추가 */
  const weekdaysEl = document.createElement("div");
  weekdaysEl.className = "calendar-weekdays";
  weekdaysEl.innerHTML = `
      <div>일</div><div>월</div><div>화</div>
      <div>수</div><div>목</div><div>금</div><div>토</div>`;
  calendar.before(weekdaysEl);

  /* 달력 렌더링 */
  function renderCalendar() {
    const y = current.getFullYear();
    const m = current.getMonth();
    monthTitle.textContent = `${y}년 ${m + 1}월`;

    calendar.innerHTML = "";

    const firstDay = new Date(y, m, 1).getDay();
    const last = new Date(y, m + 1, 0).getDate();

    /* 시작 요일까지 빈칸 */
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-day empty";
      calendar.appendChild(empty);
    }

    /* 날짜 생성 */
    for (let i = 1; i <= last; i++) {
      const dateKey = `${y}-${m + 1}-${i}`;
      const data = moods[dateKey] || {};
      const todos = data.todos || [];

      const cell = document.createElement("div");
      cell.className = "calendar-day";

      /* 숫자 */
      const dayNum = document.createElement("div");
      dayNum.className = "day-number";
      dayNum.textContent = i;

      /* 메모 미리보기 */
      const memoPreview = document.createElement("div");
      memoPreview.className = "day-memo";
      memoPreview.textContent = data.memo || "";

      /* 투두 미리보기 */
      todos.forEach((t, index) => {
        if (index >= 3) return;
        const span = document.createElement("span");
        span.className = "day-todo-item";
        if (t.done) span.classList.add("done");
        span.textContent = t.text;
        cell.appendChild(span);
      });

      if (data.color) {
        cell.style.background = data.color;
        cell.style.color = "white";
      }

      cell.appendChild(dayNum);
      if (data.memo) cell.appendChild(memoPreview);

      cell.onclick = () => selectDate(dateKey, cell);

      calendar.appendChild(cell);
    }
  }

  renderCalendar();

  function selectDate(dateKey, cell) {
    selectedDate = dateKey;

    document.querySelectorAll(".calendar-day")
      .forEach(c => c.classList.remove("selected-day"));
    cell.classList.add("selected-day");

    emotionSection.classList.remove("hidden");

    const data = moods[dateKey] || {};

    memo.value = data.memo || "";

    document.querySelectorAll(".emotion").forEach(btn => {
      btn.classList.remove("selected");
      if (btn.dataset.emotion === data.emotion) {
        btn.classList.add("selected");
        selectedEmotion = { emotion: data.emotion, color: data.color };
      }
    });

    deleteBtn.classList.toggle("hidden", !moods[dateKey]);

    renderTodos();
  }

  /* 감정 선택 */
  document.querySelectorAll(".emotion").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".emotion").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      selectedEmotion = {
        emotion: btn.dataset.emotion,
        color: btn.dataset.color
      };
    };
  });

  function saveAll() {
    localStorage.setItem("moods_" + user, JSON.stringify(moods));
  }

  /* 투두 리스트 */
  document.getElementById("add-todo").onclick = addTodo;
  todoInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTodo();
    }
  });

  function addTodo() {
    if (!selectedDate) return;
    const text = todoInput.value.trim();
    if (!text) return;

    if (!moods[selectedDate]) moods[selectedDate] = {};
    if (!Array.isArray(moods[selectedDate].todos)) moods[selectedDate].todos = [];

    moods[selectedDate].todos.push({ text, done: false });
    todoInput.value = "";

    saveAll();
    renderTodos();
    renderCalendar();
  }

  function renderTodos() {
    if (!selectedDate) return;
    const todos = moods[selectedDate]?.todos || [];
    todoList.innerHTML = "";

    todos.forEach((todo, idx) => {
      const li = document.createElement("li");
      li.className = "todo-item";

      const text = document.createElement("span");
      text.className = "todo-text";
      if (todo.done) text.classList.add("done");
      text.textContent = todo.text;

      const doneBtn = document.createElement("button");
      doneBtn.className = "todo-complete-btn";
      doneBtn.textContent = todo.done ? "되돌리기" : "완료";

      const delBtn = document.createElement("button");
      delBtn.className = "todo-delete-btn";
      delBtn.textContent = "삭제";

      doneBtn.onclick = () => {
        todo.done = !todo.done;
        saveAll();
        renderTodos();
        renderCalendar();
      };

      delBtn.onclick = () => {
        todos.splice(idx, 1);
        saveAll();
        renderTodos();
        renderCalendar();
      };

      li.appendChild(doneBtn);
      li.appendChild(text);
      li.appendChild(delBtn);

      todoList.appendChild(li);
    });
  }

  /* 저장 */
  document.getElementById("save-mood").onclick = () => {
    if (!selectedDate || !selectedEmotion) {
      alert("날짜와 감정을 선택하세요.");
      return;
    }

    const prev = moods[selectedDate] || {};
    moods[selectedDate] = {
      emotion: selectedEmotion.emotion,
      color: selectedEmotion.color,
      memo: memo.value,
      todos: prev.todos || []
    };

    saveAll();
    renderCalendar();
  };

  /* 삭제 */
  deleteBtn.onclick = () => {
    if (!selectedDate) return;
    if (!confirm("이 날짜의 기록을 삭제할까요?")) return;

    delete moods[selectedDate];
    saveAll();
    renderCalendar();
    emotionSection.classList.add("hidden");
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
            const entry = Object.values(moods)
              .find(v => v.emotion === emotion);
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
      !calendarDays.contains(e.target)
    ) {
      emotionSection.classList.add("hidden");
    }
  });
}
