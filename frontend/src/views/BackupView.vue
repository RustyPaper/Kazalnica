<template>
  <div class="container">
    <div class="card">
      <div class="backup-header">
        <h2>💾 Kopia zapasowa bazy danych</h2>
        <p class="subtitle">Pobierz kopię zapasową wszystkich danych w formacie JSON lub SQL</p>
      </div>

      <!-- Info Section -->
      <div class="info-section" v-if="backupInfo">
        <h3>📊 Informacje o bazie danych</h3>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">👥</div>
            <div class="info-content">
              <div class="info-value">{{ backupInfo.tables.users }}</div>
              <div class="info-label">Użytkownicy</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">📅</div>
            <div class="info-content">
              <div class="info-value">{{ backupInfo.tables.events }}</div>
              <div class="info-label">Wydarzenia</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">🏢</div>
            <div class="info-content">
              <div class="info-value">{{ backupInfo.tables.public_apartments }}</div>
              <div class="info-label">Publiczne lokale</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">📜</div>
            <div class="info-content">
              <div class="info-value">{{ backupInfo.tables.edit_history }}</div>
              <div class="info-label">Historia edycji</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">⚙️</div>
            <div class="info-content">
              <div class="info-value">{{ backupInfo.tables.settings }}</div>
              <div class="info-label">Ustawienia</div>
            </div>
          </div>

          <div class="info-card info-card-total">
            <div class="info-icon">💿</div>
            <div class="info-content">
              <div class="info-value">{{ backupInfo.database_size }}</div>
              <div class="info-label">Rozmiar bazy</div>
            </div>
          </div>
        </div>

        <div class="total-records">
          <strong>Łącznie rekordów:</strong> {{ backupInfo.total_records }}
        </div>
      </div>

      <!-- Download Section -->
      <div class="download-section">
        <h3>📥 Pobierz kopię zapasową</h3>
        
        <div class="backup-options">
          <!-- JSON Backup -->
          <div class="backup-option">
            <div class="backup-option-header">
              <div class="backup-icon">📄</div>
              <div>
                <h4>Format JSON</h4>
                <p>Plik JSON zawierający wszystkie dane z bazy</p>
              </div>
            </div>
            <div class="backup-details">
              <ul>
                <li>✅ Łatwy do odczytu i edycji</li>
                <li>✅ Możliwość analizy danych</li>
                <li>✅ Format uniwersalny</li>
                <li>⚠️ Nie zawiera struktury tabel</li>
              </ul>
            </div>
            <button 
              class="btn btn-primary btn-download"
              @click="downloadBackup('json')"
              :disabled="downloading !== null"
            >
              {{ downloading === 'json' ? '⏳ Pobieranie...' : '📥 Pobierz JSON' }}
            </button>
          </div>

          <!-- SQL Backup -->
          <div class="backup-option">
            <div class="backup-option-header">
              <div class="backup-icon">🗄️</div>
              <div>
                <h4>Format SQL (Pełny dump)</h4>
                <p>Kompletny export danych do utworzenia nowej bazy</p>
              </div>
            </div>
            <div class="backup-details">
              <ul>
                <li>✅ Pełny dump wszystkich danych</li>
                <li>✅ Nie modyfikuje istniejącej bazy</li>
                <li>✅ Używa ON CONFLICT - bezpieczny import</li>
                <li>✅ Kompatybilny z PostgreSQL</li>
                <li>✅ Gotowy do utworzenia kopii bazy</li>
              </ul>
            </div>
            <button 
              class="btn btn-success btn-download"
              @click="downloadBackup('sql')"
              :disabled="downloading !== null"
            >
              {{ downloading === 'sql' ? '⏳ Pobieranie...' : '📥 Pobierz SQL' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions-section">
        <h3>📖 Instrukcja przywracania backupu</h3>
        
        <div class="instruction-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'json' }]"
            @click="activeTab = 'json'"
          >
            JSON
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'sql' }]"
            @click="activeTab = 'sql'"
          >
            SQL
          </button>
        </div>

        <div v-if="activeTab === 'json'" class="instruction-content">
          <h4>Przywracanie z pliku JSON:</h4>
          <ol>
            <li>Backup JSON służy głównie do analizy i archiwizacji danych</li>
            <li>Dane można przetwarzać programowo (Python, Node.js, etc.)</li>
            <li>Aby przywrócić dane, potrzebny jest dedykowany skrypt importu</li>
          </ol>
          <div class="code-block">
            <pre>// Przykład odczytu w Node.js
const backup = require('./backup_2024-01-15.json');
console.log('Użytkownicy:', backup.tables.users.length);</pre>
          </div>
        </div>

        <div v-if="activeTab === 'sql'" class="instruction-content">
          <h4>Jak utworzyć nową bazę danych z backupu:</h4>
          
          <div class="step-by-step">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <strong>Utwórz nową bazę danych PostgreSQL</strong>
                <div class="code-block">
                  <pre># Linux/Mac
createdb calendar_app_backup

# Windows (w cmd jako postgres user)
psql -U postgres
CREATE DATABASE calendar_app_backup;
\q</pre>
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <strong>Zaktualizuj connection string w aplikacji</strong>
                <div class="code-block">
                  <pre># W pliku .env (backend):
DATABASE_URL=postgresql://user:password@localhost:5432/calendar_app_backup</pre>
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <strong>Uruchom aplikację, aby utworzyć tabele</strong>
                <div class="code-block">
                  <pre>cd backend
npm run dev
# Poczekaj aż zobaczysz "✅ Tabele utworzone pomyślnie"
# Następnie zatrzymaj serwer (Ctrl+C)</pre>
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <strong>Zaimportuj dane z backupu</strong>
                <div class="code-block">
                  <pre># Linux/Mac
psql -U username -d calendar_app_backup -f backup_2024-01-15.sql

# Windows
psql -U postgres -d calendar_app_backup -f backup_2024-01-15.sql

# Lub przez pgAdmin:
# 1. Otwórz calendar_app_backup
# 2. Tools → Query Tool
# 3. Wklej zawartość pliku backup.sql
# 4. Kliknij Execute (F5)</pre>
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">5</div>
              <div class="step-content">
                <strong>Uruchom ponownie aplikację</strong>
                <div class="code-block">
                  <pre>cd backend
npm run dev

# Aplikacja będzie teraz używać nowej bazy z zaimportowanymi danymi</pre>
                </div>
              </div>
            </div>
          </div>

          <div class="success-box">
            <strong>✅ Bezpieczeństwo:</strong> Ten backup NIE modyfikuje istniejącej bazy danych.
            Wszystkie dane są importowane do nowej bazy. Twoja oryginalna baza pozostaje nietknięta.
          </div>

          <div class="info-box">
            <strong>💡 Wskazówka:</strong> Jeśli chcesz zachować obie bazy:
            <ul>
              <li>Stara baza: <code>calendar_app</code> (produkcja)</li>
              <li>Nowa baza: <code>calendar_app_backup</code> (kopia)</li>
            </ul>
            Możesz przełączać się między nimi zmieniając <code>DATABASE_URL</code> w pliku <code>.env</code>
          </div>

          <div class="warning">
            <strong>⚠️ Jak działa import:</strong> 
            Ten backup SQL używa <code>ON CONFLICT DO UPDATE</code>, co oznacza:
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>✅ Jeśli rekord istnieje - zostanie zaktualizowany</li>
              <li>✅ Jeśli rekord nie istnieje - zostanie dodany</li>
              <li>✅ Import jest bezpieczny i nie usuwa danych</li>
            </ul>
            <strong>Najlepsze praktyki:</strong>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Zawsze twórz NOWĄ bazę danych (np. <code>calendar_app_backup</code>)</li>
              <li>Uruchom aplikację raz, aby utworzyć strukturę tabel</li>
              <li>Zaimportuj backup do nowej bazy</li>
              <li>Sprawdź czy wszystko działa przed przełączeniem produkcji</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { API_URL } from '../config';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const backupInfo = ref<any>(null);
const downloading = ref<string | null>(null);
const error = ref('');
const success = ref('');
const activeTab = ref<'json' | 'sql'>('sql');

// Sprawdź czy admin
if (!authStore.isAdmin) {
  router.push('/');
}

const fetchBackupInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}/backup/info`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    backupInfo.value = response.data;
  } catch (err: any) {
    console.error('Błąd pobierania info:', err);
    error.value = 'Nie udało się pobrać informacji o bazie danych';
  }
};

const downloadBackup = async (format: 'json' | 'sql') => {
  try {
    downloading.value = format;
    error.value = '';
    success.value = '';

    let blob: Blob;
    let filename: string;

    if (format === 'json') {
      // Pobierz JSON
      const response = await axios.get(`${API_URL}/backup/json`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        },
        responseType: 'json'
      });

      blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      filename = `calendar_backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`;

    } else {
      // Pobierz SQL
      const response = await axios.get(`${API_URL}/backup/sql`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        },
        responseType: 'blob'
      });

      blob = response.data;
      filename = `calendar_backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.sql`;
    }

    // Pobierz plik
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    success.value = `✅ Backup ${format.toUpperCase()} pobrany pomyślnie!`;

    setTimeout(() => {
      success.value = '';
    }, 5000);

  } catch (err: any) {
    console.error('Błąd pobierania backupu:', err);
    error.value = err.response?.data?.error || `Nie udało się pobrać backupu ${format.toUpperCase()}`;
  } finally {
    downloading.value = null;
  }
};

onMounted(() => {
  fetchBackupInfo();
});
</script>

<style scoped>
.backup-header {
  text-align: center;
  margin-bottom: 30px;
}

.backup-header h2 {
  margin-bottom: 10px;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.info-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.info-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.info-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info-card-total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.info-icon {
  font-size: 32px;
}

.info-content {
  flex: 1;
}

.info-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 5px;
}

.info-label {
  font-size: 12px;
  color: #666;
}

.info-card-total .info-label {
  color: rgba(255,255,255,0.9);
}

.total-records {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  font-size: 16px;
}

.download-section {
  margin-bottom: 30px;
}

.download-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.backup-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.backup-option {
  border: 2px solid #dee2e6;
  border-radius: 12px;
  padding: 20px;
  background: white;
  transition: all 0.3s;
}

.backup-option:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.backup-option-header {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
}

.backup-icon {
  font-size: 40px;
}

.backup-option h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
}

.backup-option p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.backup-details {
  margin-bottom: 20px;
}

.backup-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.backup-details li {
  padding: 5px 0;
  font-size: 13px;
  color: #555;
}

.btn-download {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
}

.instructions-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.instructions-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.instruction-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: 2px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #667eea;
  background: #f0f2ff;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.instruction-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.instruction-content h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.instruction-content ol {
  margin-bottom: 15px;
  padding-left: 20px;
}

.instruction-content li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.step-by-step {
  margin: 20px 0;
}

.step {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #e9ecef;
}

.step:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content strong {
  display: block;
  margin-bottom: 10px;
  color: #333;
  font-size: 15px;
}

.code-block {
  background: #282c34;
  color: #abb2bf;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 15px 0;
}

.code-block pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #d63384;
}

.success-box {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
}

.success-box strong {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.info-box {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.info-box strong {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
}

.info-box ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.info-box li {
  margin: 5px 0;
}

.info-box code {
  background: rgba(0,0,0,0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.warning strong {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
}

.warning ul,
.warning ol {
  margin: 10px 0;
  padding-left: 20px;
}

.warning li {
  margin: 5px 0;
  line-height: 1.5;
}

.warning code {
  background: rgba(0,0,0,0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #f5c6cb;
  margin-top: 20px;
}

.success {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #c3e6cb;
  margin-top: 20px;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .backup-options {
    grid-template-columns: 1fr;
  }

  .backup-option-header {
    flex-direction: column;
  }

  .code-block {
    font-size: 11px;
  }

  .step {
    flex-direction: column;
  }

  .step-number {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .backup-icon {
    font-size: 32px;
  }

  .info-icon {
    font-size: 24px;
  }

  .info-value {
    font-size: 20px;
  }

  .backup-header h2 {
    font-size: 20px;
  }

  .instruction-tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
  }

  .code-block pre {
    font-size: 10px;
  }
}
</style>

