(function() {
  // Elemen DOM
  const kotaSelect = document.getElementById('kotaSelect');
  const kotaSearch = document.getElementById('kotaSearch');
  const totalKotaDisplay = document.getElementById('totalKotaDisplay');
  const lokasiDisplay = document.getElementById('lokasiDisplay');
  const tbody = document.getElementById('tableBody');
  const msgPanel = document.getElementById('messagePanel');
  const updateTimeSpan = document.getElementById('updateTime');

  // Dark mode elements
  const darkModeToggle = document.getElementById('darkModeToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  const toggleText = document.getElementById('toggleText');

  // State
  let daftarKotaOriginal = [];
  let filteredKota = [];
  let currentKotaId = null;
  let lastFetchTime = new Date(); // Set default ke waktu sekarang

  // ========== DARK MODE ==========
  function initDarkMode() {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    if (savedMode) {
      document.body.classList.add('dark-mode');
      toggleIcon.textContent = '🌙';
      toggleText.textContent = 'Mode Gelap';
    }
  }

  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    toggleIcon.textContent = isDark ? '🌙' : '☀️';
    toggleText.textContent = isDark ? 'Mode Gelap' : 'Mode Terang';
    
    // Animasi toggle
    darkModeToggle.style.transform = 'scale(1.1)';
    setTimeout(() => {
      darkModeToggle.style.transform = 'scale(1)';
    }, 200);
  });

  // ========== HELPER ==========
  function formatWaktu(date) {
    if (!date) return '--:--:--';
    
    const jam = String(date.getHours()).padStart(2, '0');
    const menit = String(date.getMinutes()).padStart(2, '0');
    const detik = String(date.getSeconds()).padStart(2, '0');
    
    return `${jam}.${menit}.${detik}`;
  }

  // ========== FUNGSI UPDATE WAKTU REALTIME ==========
  function updateWaktuRealtime() {
    if (updateTimeSpan) {
      // Update setiap detik dengan waktu terakhir fetch
      setInterval(() => {
        if (lastFetchTime) {
          updateTimeSpan.textContent = formatWaktu(lastFetchTime);
        } else {
          // Jika belum ada fetch, tampilkan waktu sekarang
          updateTimeSpan.textContent = formatWaktu(new Date());
        }
      }, 1000); // Update setiap 1000ms (1 detik)
    }
  }

  // Panggil fungsi update waktu segera setelah script dimuat
  updateWaktuRealtime();

  // tanggal hari ini format YYYY-MM-DD
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  function showMessage(type, text) {
    if (type === 'loading') msgPanel.innerHTML = `<div class="loading animate__animated animate__fadeInLeft"><span>⏳</span> ${text}</div>`;
    else if (type === 'error') msgPanel.innerHTML = `<div class="error animate__animated animate__shakeX"><span>❌</span> ${text}</div>`;
    else if (type === 'success') msgPanel.innerHTML = `<div class="success-info animate__animated animate__fadeInRight"><span>✅</span> ${text}</div>`;
    else msgPanel.innerHTML = '';
  }
  
  function clearMessage() { msgPanel.innerHTML = ''; }

  // ========== RENDER TABEL JADWAL DENGAN ANIMASI ==========
  function renderTable(jadwalList) {
    if (!jadwalList || jadwalList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding:2rem; text-align:center;">📭 Tidak ada jadwal untuk bulan ini</td></tr>`;
      return;
    }
    
    let html = '';
    jadwalList.forEach((item, index) => {
      const tanggal = item.tanggal || '-';
      const imsak = item.imsak || '--:--';
      const subuh = item.subuh || '--:--';
      const dzuhur = item.dzuhur || item.dhuhur || '--:--';
      const ashar = item.ashar || '--:--';
      const maghrib = item.maghrib || '--:--';
      const isya = item.isya || '--:--';

      let isToday = false;
      if (item.date) {
        isToday = (item.date === todayStr);
      } else {
        const match = tanggal.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          const d = match[1];
          const m = match[2];
          const y = match[3];
          if (y == todayYear && m == todayMonth && d == todayDay) {
            isToday = true;
          }
        }
      }

      const rowClass = isToday ? 'today-row' : '';
      const animationClass = index < 5 ? 'animate__animated animate__fadeInUp' : '';
      html += `<tr class="${rowClass} ${animationClass}" style="animation-delay: ${index * 0.03}s">
        <td>${tanggal}</td>
        <td>${imsak}</td>
        <td>${subuh}</td>
        <td>${dzuhur}</td>
        <td>${ashar}</td>
        <td>${maghrib}</td>
        <td>${isya}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  // ========== FETCH JADWAL ==========
  async function fetchJadwal(kotaId, showLoading = true) {
    if (!kotaId) return;
    
    const tahun = new Date().getFullYear();
    const bulan = String(new Date().getMonth() + 1).padStart(2, '0');
    const url = `https://api.myquran.com/v2/sholat/jadwal/${kotaId}/${tahun}/${bulan}`;

    if (showLoading) showMessage('loading', 'Mengambil jadwal terkini...');

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const result = await res.json();
      if (!result.status || !result.data || !result.data.jadwal) {
        throw new Error('Data tidak ditemukan');
      }

      // Update lokasi display
      const lokasi = result.data.lokasi || 'Kota';
      const daerah = result.data.daerah || '';
      lokasiDisplay.textContent = `${lokasi} ${daerah ? '- ' + daerah : ''}`;

      // Render tabel
      renderTable(result.data.jadwal);
      
      // UPDATE WAKTU TERAKHIR FETCH - INI YANG PALING PENTING
      lastFetchTime = new Date();
      
      // TAMPILKAN WAKTU SECARA LANGSUNG (Langsung update tanpa nunggu interval)
      updateTimeSpan.textContent = formatWaktu(lastFetchTime);
      
      // Log untuk debugging
      console.log('Waktu update:', formatWaktu(lastFetchTime));

      clearMessage();
      showMessage('success', `Jadwal berhasil dimuat pukul ${formatWaktu(lastFetchTime)}`);
      
      setTimeout(() => { 
        if (msgPanel.innerHTML.includes('berhasil')) clearMessage(); 
      }, 2500);

    } catch (err) {
      console.error('Error fetch jadwal:', err);
      showMessage('error', `Gagal memuat jadwal: ${err.message}`);
      
      if (!tbody.children.length || tbody.children[0].children[0].colSpan === 7) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:2rem; text-align:center;">🚫 Gagal memuat data. Coba lagi nanti.</td></tr>`;
      }
    }
  }

  // ========== FETCH SEMUA KOTA ==========
  async function fetchSemuaKota() {
    try {
      showMessage('loading', 'Memuat daftar kota dari API...');
      
      const response = await fetch('https://api.myquran.com/v2/sholat/kota/semua');
      if (!response.ok) throw new Error('Gagal mengambil daftar kota');
      
      const result = await response.json();
      
      if (!result.status || !result.data) {
        throw new Error('Data kota tidak valid');
      }

      const dataKota = result.data; 
      daftarKotaOriginal = dataKota.map(item => ({
        id: String(item[0]),
        nama: item[1],
        daerah: item[2] || ''
      }));

      // Urutkan berdasarkan nama
      daftarKotaOriginal.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

      filteredKota = [...daftarKotaOriginal];
      renderDropdown(filteredKota);
      totalKotaDisplay.textContent = `📋 ${daftarKotaOriginal.length} kota tersedia`;

      // Set default ke Jakarta (1301) jika ada
      const defaultKota = daftarKotaOriginal.find(k => k.id === '1301') || daftarKotaOriginal[0];
      if (defaultKota) {
        kotaSelect.value = defaultKota.id;
        currentKotaId = defaultKota.id;
        lokasiDisplay.textContent = `${defaultKota.nama} - ${defaultKota.daerah}`;
        
        // Fetch jadwal untuk kota default
        await fetchJadwal(defaultKota.id, true);
      }

      clearMessage();
      
    } catch (error) {
      console.error('Gagal fetch daftar kota:', error);
      showMessage('error', 'Tidak dapat memuat daftar kota. Gunakan dropdown manual.');
      
      // Fallback data kota
      daftarKotaOriginal = [
        { id: '1301', nama: 'Jakarta', daerah: 'DKI Jakarta' },
        { id: '1207', nama: 'Bandung', daerah: 'Jawa Barat' },
        { id: '1302', nama: 'Surabaya', daerah: 'Jawa Timur' },
        { id: '0512', nama: 'Yogyakarta', daerah: 'DIY' },
        { id: '1606', nama: 'Medan', daerah: 'Sumatera Utara' },
        { id: '0303', nama: 'Palembang', daerah: 'Sumatera Selatan' },
        { id: '1403', nama: 'Semarang', daerah: 'Jawa Tengah' },
        { id: '1504', nama: 'Denpasar', daerah: 'Bali' }
      ];
      
      filteredKota = [...daftarKotaOriginal];
      renderDropdown(filteredKota);
      totalKotaDisplay.textContent = `📋 ${daftarKotaOriginal.length} kota (offline)`; 
      
      kotaSelect.value = '1301';
      currentKotaId = '1301';
      lokasiDisplay.textContent = 'Jakarta - DKI Jakarta';
      
      // Tetap fetch jadwal meskipun daftar kota offline
      await fetchJadwal('1301', true);
    }
  }

  // ========== RENDER DROPDOWN ==========
  function renderDropdown(kotaList) {
    let options = '';
    kotaList.forEach(k => {
      options += `<option value="${k.id}">${k.nama} (${k.daerah})</option>`;
    });
    kotaSelect.innerHTML = options;
    
    if (currentKotaId && kotaList.some(k => k.id === currentKotaId)) {
      kotaSelect.value = currentKotaId;
    }
  }

  // ========== FILTER KOTA ==========
  function filterKota(searchTerm) {
    if (!searchTerm.trim()) {
      filteredKota = [...daftarKotaOriginal];
    } else {
      const term = searchTerm.toLowerCase().trim();
      filteredKota = daftarKotaOriginal.filter(k => 
        k.nama.toLowerCase().includes(term) || 
        k.daerah.toLowerCase().includes(term)
      );
    }
    renderDropdown(filteredKota);
  }

  // ========== EVENT LISTENERS ==========
  
  // Event search
  kotaSearch.addEventListener('input', function(e) {
    filterKota(e.target.value);
  });

  // Event dropdown berubah
  kotaSelect.addEventListener('change', function(e) {
    const selectedId = e.target.value;
    if (!selectedId) return;
    
    currentKotaId = selectedId;
    const kotaPilihan = daftarKotaOriginal.find(k => k.id === selectedId);
    
    if (kotaPilihan) {
      lokasiDisplay.textContent = `${kotaPilihan.nama} - ${kotaPilihan.daerah}`;
    }
    
    fetchJadwal(selectedId, true);
  });

  // ========== INITIALIZATION ==========
  
  // Inisialisasi dark mode
  initDarkMode();
  
  // Tampilkan waktu awal
  updateTimeSpan.textContent = formatWaktu(new Date());
  
  // Fetch semua kota (akan otomatis fetch jadwal juga)
  fetchSemuaKota();

  // Refresh manual saat tab aktif kembali (setelah 5 menit)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && lastFetchTime) {
      const secondsSince = (new Date() - lastFetchTime) / 1000;
      if (secondsSince > 300) { // 5 menit
        fetchJadwal(currentKotaId, false);
      }
    }
  });

  // Debugging: log setiap 5 detik untuk memastikan interval berjalan
  setInterval(() => {
    console.log('Interval berjalan, waktu:', formatWaktu(lastFetchTime));
  }, 5000);
})();
