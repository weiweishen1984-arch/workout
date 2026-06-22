/* js/storage.js — All localStorage operations */

const AppDB = (() => {
  const KEY = 'posture_tracker_v1';

  const DEFAULTS = {
    version: 1,
    trainings: {},  // { 'YYYY-MM-DD': { type, exercises, finished, startedAt, finishedAt } }
    records: [],    // [{ date, weight, waist, sleep, fatigue, pain, timestamp }]
    photos: {}      // { 'YYYY-MM-DD': { front, side, back } }
  };

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
      return Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), JSON.parse(raw));
    } catch {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        AppUI.toast('存储空间已满，请导出数据后清理照片');
      }
      return false;
    }
  }

  // ——— Date helpers ———
  function dateStr(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function weekStart(d = new Date()) {
    const date = new Date(d);
    const dow = date.getDay(); // 0=Sun
    const diff = dow === 0 ? -6 : 1 - dow; // adjust to Monday
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // ——— Training ———
  function getTodayTraining() {
    const db = get();
    const today = dateStr();
    return db.trainings[today] || null;
  }

  function getTraining(date) {
    return get().trainings[date] || null;
  }

  function getAllTrainings() {
    return get().trainings;
  }

  function getTodayTrainingType() {
    const db = get();
    const today = dateStr();
    if (db.trainings[today]?.type) return db.trainings[today].type;

    // Find most recent past training
    const sorted = Object.keys(db.trainings).sort().reverse();
    for (const d of sorted) {
      if (d < today && db.trainings[d]?.type) {
        return db.trainings[d].type === 'A' ? 'B' : 'A';
      }
    }
    return 'A';
  }

  function initTodayTraining(type) {
    const db = get();
    const today = dateStr();
    if (!db.trainings[today]) {
      const exercises = {};
      TRAINING_PLANS[type].forEach(id => { exercises[id] = false; });
      db.trainings[today] = { type, exercises, finished: false, startedAt: Date.now(), finishedAt: null };
      save(db);
    }
    return db.trainings[today];
  }

  function toggleExercise(exerciseId) {
    const db = get();
    const today = dateStr();
    if (!db.trainings[today]) return;
    db.trainings[today].exercises[exerciseId] = !db.trainings[today].exercises[exerciseId];
    save(db);
  }

  function completeTraining() {
    const db = get();
    const today = dateStr();
    if (!db.trainings[today]) return;
    db.trainings[today].finished = true;
    db.trainings[today].finishedAt = Date.now();
    save(db);
  }

  // ——— Records ———
  function getRecords() {
    return [...get().records].sort((a, b) => b.date.localeCompare(a.date));
  }

  function addRecord(rec) {
    const db = get();
    // Replace today's record if exists
    const today = dateStr();
    const idx = db.records.findIndex(r => r.date === today);
    const record = { date: today, timestamp: Date.now(), ...rec };
    if (idx >= 0) db.records[idx] = record;
    else db.records.push(record);
    save(db);
  }

  function getLatestRecord() {
    const recs = getRecords();
    return recs.length ? recs[0] : null;
  }

  // ——— Photos ———
  function getPhotos(date) {
    return get().photos[date] || {};
  }

  function getAllPhotoDates() {
    const photos = get().photos;
    return Object.keys(photos).filter(d => {
      const p = photos[d];
      return p.front || p.side || p.back;
    }).sort().reverse();
  }

  function savePhoto(date, type, dataUrl) {
    const db = get();
    if (!db.photos[date]) db.photos[date] = {};
    db.photos[date][type] = dataUrl;
    return save(db);
  }

  function deletePhoto(date, type) {
    const db = get();
    if (db.photos[date]) {
      delete db.photos[date][type];
      if (!db.photos[date].front && !db.photos[date].side && !db.photos[date].back) {
        delete db.photos[date];
      }
    }
    save(db);
  }

  // ——— Stats ———
  function getStreak() {
    const trainings = get().trainings;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = dateStr(today);
    const todayDone = trainings[todayStr]?.finished;

    let streak = 0;
    const check = new Date(today);
    if (!todayDone) check.setDate(check.getDate() - 1);

    for (let i = 0; i < 365; i++) {
      const s = dateStr(check);
      if (trainings[s]?.finished) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    return streak;
  }

  function getWeeklyCompletion(weekStartDate) {
    const trainings = get().trainings;
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const s = dateStr(d);
      if (trainings[s]?.finished) done++;
    }
    return done; // out of 7
  }

  function getWeeklyTrainingCounts(weeksBack = 8) {
    const trainings = get().trainings;
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let w = weeksBack - 1; w >= 0; w--) {
      const ws = weekStart(today);
      ws.setDate(ws.getDate() - w * 7);
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(ws);
        d.setDate(d.getDate() + i);
        const s = dateStr(d);
        if (trainings[s]?.finished) count++;
      }
      const label = `${ws.getMonth() + 1}/${ws.getDate()}`;
      result.push({ label, count, weekStart: new Date(ws) });
    }
    return result;
  }

  // ——— Import / Export ———
  function exportJSON() {
    const db = get();
    return JSON.stringify(db, null, 2);
  }

  function importJSON(json) {
    try {
      const data = JSON.parse(json);
      if (!data.trainings && !data.records && !data.photos) throw new Error('格式错误');
      save(data);
      return true;
    } catch {
      return false;
    }
  }

  function clearAll() {
    localStorage.removeItem(KEY);
  }

  return {
    get, save, dateStr, weekStart,
    getTodayTraining, getTraining, getAllTrainings, getTodayTrainingType,
    initTodayTraining, toggleExercise, completeTraining,
    getRecords, addRecord, getLatestRecord,
    getPhotos, getAllPhotoDates, savePhoto, deletePhoto,
    getStreak, getWeeklyCompletion, getWeeklyTrainingCounts,
    exportJSON, importJSON, clearAll
  };
})();

// ——— Shared Exercise Data ———
const EXERCISES = {
  '90-90-breathing': {
    name: '90/90 呼吸',
    sets: '3 组',
    reps: '每组 5 次呼吸',
    duration: 30,
    desc: '仰卧，小腿架在椅子或墙上呈 90°，深吸气时让腹部横向扩张，呼气时轻收腹部。帮助重新激活横膈膜，缓解胸椎代偿。'
  },
  'dead-bug': {
    name: 'Dead Bug',
    sets: '3 组',
    reps: '每侧 5 次',
    duration: 40,
    desc: '仰卧，手臂指向天花板，双腿抬起呈 90°。缓慢对侧延伸手脚，保持腰椎紧贴地面，不允许弓背。核心抗旋转控制练习。'
  },
  'bird-dog': {
    name: 'Bird Dog',
    sets: '3 组',
    reps: '每侧 5 次',
    duration: 40,
    desc: '四肢跪撑，对侧手脚同时缓慢延伸至平行地面，保持骨盆水平，不旋转不侧倾。核心稳定与脊柱中立位训练。'
  },
  'glute-bridge': {
    name: '臀桥',
    sets: '3 组',
    reps: '每组 15 次',
    duration: 45,
    desc: '仰卧屈膝，双脚踩地与肩同宽，呼气时臀部上抬至膝-髋-肩成直线，顶部收紧臀肌 1 秒再下放。激活臀大肌，改善骨盆前倾。'
  },
  'clamshell': {
    name: '蚌式开合',
    sets: '3 组',
    reps: '每侧 15 次',
    duration: 45,
    desc: '侧卧屈髋 45°、屈膝 90°，保持足部叠放。用臀中肌发力将上方膝盖向上打开，控制下放，避免骨盆后倾。改善外展力量，对抗X型腿。'
  },
  'side-plank': {
    name: 'Side Plank',
    sets: '3 组',
    reps: '每侧 30 秒',
    duration: 35,
    desc: '侧卧前臂支撑，将身体撑离地面呈一直线，收紧侧腰与臀部。保持呼吸均匀，避免臀部下沉或前突。侧链抗侧屈稳定训练。'
  }
};

const TRAINING_PLANS = {
  A: ['90-90-breathing', 'dead-bug', 'bird-dog', 'glute-bridge', 'side-plank'],
  B: ['90-90-breathing', 'dead-bug', 'bird-dog', 'clamshell', 'side-plank']
};
