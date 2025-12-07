# Quick Start Guide - localStorage Backup

## 🚀 How to Use

The localStorage backup system works **automatically**. You don't need to do anything special!

## ✨ Features Demo

### 1. Normal Usage (Online)
```
1. Open the app
2. Create a new itinerary
3. Add activities
4. Edit details
5. Everything saves to both server AND localStorage
```

### 2. Offline Mode
```
1. Open the app
2. Disable your internet connection (or server crashes)
3. Continue working normally:
   - Create new itinerarios ✅
   - Edit existing ones ✅
   - Add activities ✅
   - Delete items ✅
4. See warning banner: "⚠️ Modo sin conexión"
5. All changes saved to localStorage
6. Reconnect internet
7. Data syncs back when API becomes available
```

### 3. Data Recovery
```
Scenario: Server database is corrupted/deleted

1. User opens app
2. Server returns empty data []
3. App automatically loads from localStorage
4. All user's data restored! ✅
5. Banner shows: "Datos cargados desde localStorage"
```

## 🎯 Testing the Feature

### Test 1: Create Without Server
```bash
# In one terminal, start the app
npm run dev

# In browser DevTools console:
# 1. Open Network tab
# 2. Set to "Offline" mode
# 3. Try creating an itinerary
# 4. ✅ It should work and show offline banner
# 5. Check Application → Local Storage → localhost
# 6. See your data saved there!
```

### Test 2: Persist Between Sessions
```bash
1. Create an itinerary
2. Close the browser completely
3. Reopen the browser
4. Navigate to the app
5. ✅ Your data is still there!
```

### Test 3: Temporary IDs
```bash
# In browser console while offline:
localStorage.getItem('itinerarios_backup')

# You'll see IDs like:
{
  "id": "temp_1733604123456_abc123xyz",
  "nombre": "My Trip",
  ...
}
```

### Test 4: Import/Export Works Offline
```bash
1. Set browser to offline mode
2. Create some itinerarios
3. Click "Exportar JSON"
4. ✅ Downloads your local data
5. Clear localStorage
6. Click "Importar JSON"
7. ✅ Imports back to localStorage
```

## 🔍 Debugging

### View localStorage Data
```javascript
// In browser console:

// See all itinerarios
JSON.parse(localStorage.getItem('itinerarios_backup'))

// See last sync time
localStorage.getItem('itinerarios_last_sync')

// Clear localStorage
localStorage.removeItem('itinerarios_backup')
localStorage.removeItem('itinerarios_last_sync')
```

### Check Status
```javascript
// Look for the warning banner:
// "⚠️ Modo sin conexión - Los datos se guardan solo en localStorage"

// If you see this, you're in offline mode
```

## 📱 Browser Compatibility

localStorage works in all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Mobile browsers

Storage Limits:
- ~5-10MB per domain (plenty for itineraries)

## 🔒 Data Privacy

- Data is stored **only in your browser**
- Not shared with other users
- Clears when you clear browser data
- Each browser/device has its own copy

## 🎓 Advanced Usage

### Programmatic Access
```typescript
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  generateTempId,
  isTempId,
} from "@/lib/localStorage";

// Save data
const itinerarios = [...];
saveToLocalStorage(itinerarios);

// Load data
const data = loadFromLocalStorage();

// Generate temp ID
const id = generateTempId();
console.log(id); // "temp_1733604123456_abc123xyz"

// Check if ID is temporary
if (isTempId(id)) {
  console.log("This item was created offline");
}
```

### Manual Sync
```typescript
// In component:
const [itinerarios, setItinerarios] = useState([]);

// Load on mount
useEffect(() => {
  const local = loadFromLocalStorage();
  if (local) setItinerarios(local);
}, []);

// Save on change
useEffect(() => {
  saveToLocalStorage(itinerarios);
}, [itinerarios]);
```

## 🐛 Troubleshooting

### Issue: Data not saving
```bash
# Check if localStorage is enabled:
typeof Storage !== 'undefined' && localStorage

# Check quota:
navigator.storage.estimate().then(estimate => {
  console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
});
```

### Issue: Old data showing
```bash
# Clear localStorage and refresh:
localStorage.clear();
location.reload();
```

### Issue: Cannot save large data
```bash
# localStorage has ~5MB limit
# Each itinerary is ~1-5KB
# You can store ~1000-5000 itineraries

# Check size:
const data = localStorage.getItem('itinerarios_backup');
console.log(`Size: ${data.length / 1024}KB`);
```

## 💡 Pro Tips

1. **Export regularly** - Click "Exportar JSON" to backup to file
2. **Check the banner** - Know when you're offline
3. **Clear old data** - Use "Limpiar base de datos" occasionally
4. **Use multiple browsers** - Each has independent storage
5. **DevTools are your friend** - Inspect localStorage anytime

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Creating items works even when server is down
- ✅ Data persists after browser restart
- ✅ Warning banner appears in offline mode
- ✅ localStorage in DevTools shows your data
- ✅ Export/Import works without server

## 📚 Further Reading

- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- See `README_LOCALSTORAGE.md` for full documentation

---

**Enjoy your resilient, offline-capable itinerary planner!** 🎊
