import { useState, useEffect } from 'react';
import { Search, Lock, UserPlus, Upload, CheckCircle2, AlertCircle, RefreshCw, Undo2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; 

export default function LockerManager() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'assign' | 'logger'>('inventory');
  
  // Inventory State
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Assign State
  const [assignData, setAssignData] = useState({ name: '', room: 'Girls', letter: 'T', number: '', other: '', serial: '' });
  const [assignMsg, setAssignMsg] = useState({ text: '', type: '' });

  // Logger State
  const [logSerial, setLogSerial] = useState('');
  const [logs, setLogs] = useState<{ id: string, text: string, type: 'success' | 'error' }[]>([]);

  // Helpers
  const cleanSerial = (input: string) => input.replace(/\D/g, '').slice(-8);
  const cleanLockerNum = (input: string) => parseInt(input.replace(/\D/g, ''), 10);

  const loadInventory = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const q = query(collection(db, "locks"), where("inRotation", "==", true));
      const snapshot = await getDocs(q);
      const locks: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        locks.push({
          serial: doc.id,
          combination: data.combination || "N/A",
          status: data.status || "available",
          studentName: data.studentName || data.name || "--",
          assignedLocker: data.assignedLocker || "--"
        });
      });
      setInventory(locks.sort((a, b) => a.serial.localeCompare(b.serial)));
    } catch (error) {
      console.error("Error loading inventory", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'inventory') loadInventory();
  }, [activeTab]);

  const filteredInventory = inventory.filter(lock => 
    lock.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lock.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lock.assignedLocker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!assignData.name || !assignData.serial) {
      setAssignMsg({ text: "Name and Serial Number are required.", type: "error" });
      return;
    }

    let finalLockerId = "";
    const cleanNum = cleanLockerNum(assignData.number);

    if (assignData.room === "Other") {
      if (!assignData.other) return setAssignMsg({ text: "Explanation required for 'Other'.", type: "error" });
      finalLockerId = "Other";
    } else {
      if (isNaN(cleanNum)) return setAssignMsg({ text: "Invalid locker number.", type: "error" });
      
      const limits: Record<string, Record<string, number>> = {
        Boys: { T: 236, P: 342, V: 20 },
        Girls: { T: 136, P: 342, V: 20 }
      };
      
      const max = limits[assignData.room][assignData.letter];
      if (cleanNum < 1 || cleanNum > max) {
        return setAssignMsg({ text: `${assignData.room} ${assignData.letter} section maxes at ${max}.`, type: "error" });
      }
      finalLockerId = `${assignData.letter}${cleanNum}`;
    }

    const cleanSerialNum = cleanSerial(assignData.serial);
    try {
      const lockRef = doc(db, "locks", cleanSerialNum);
      await updateDoc(lockRef, {
        status: "assigned",
        studentName: assignData.name,
        assignedRoom: assignData.room,
        assignedLocker: finalLockerId,
        dateAssigned: new Date().toISOString(),
        ...(assignData.room === "Other" && { otherExplanation: assignData.other })
      });
      setAssignMsg({ text: "Locker assigned successfully!", type: "success" });
      setAssignData({ name: '', room: 'Girls', letter: 'T', number: '', other: '', serial: '' });
      loadInventory();
    } catch (error) {
      setAssignMsg({ text: "Serial number not found in master database.", type: "error" });
    }
  };

  const handleLogLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSerial) return;
    const cleanNum = cleanSerial(logSerial);
    
    try {
      const lockRef = doc(db, "locks", cleanNum);
      const docSnap = await getDoc(lockRef);
      
      if (!docSnap.exists()) throw new Error("Not found");
      
      const data = docSnap.data();
      const sName = data.studentName || data.name || "Unknown Student";
      
      await updateDoc(lockRef, { inRotation: true });
      setLogs(prev => [{ id: Date.now().toString(), text: `Added #${cleanNum} (${sName}) to active rotation.`, type: 'success' }, ...prev]);
    } catch (error) {
      setLogs(prev => [{ id: Date.now().toString(), text: `Error: #${cleanNum} not found in master list!`, type: 'error' }, ...prev]);
    }
    setLogSerial('');
  };

  // NEW FUNCTION: Handle returning a lock
  const handleReturnLock = async (serial: string, studentName: string) => {
    if (!confirm(`Are you sure you want to return lock #${serial} from ${studentName}?`)) return;
    
    try {
      const lockRef = doc(db, "locks", serial);
      await updateDoc(lockRef, {
        status: "available",
        studentName: "",
        assignedRoom: "",
        assignedLocker: "",
        dateAssigned: "",
        otherExplanation: ""
      });
      loadInventory(); // Refresh the table automatically
    } catch (error) {
      console.error("Error returning lock", error);
      alert("Failed to return lock. Please check your connection.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex border-b border-slate-200 mb-6">
        <button onClick={() => setActiveTab('inventory')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Inventory Lookup</button>
        <button onClick={() => setActiveTab('assign')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'assign' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Assign Locker</button>
        <button onClick={() => setActiveTab('logger')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'logger' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Activate Locks</button>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search by name, serial, or locker..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <button onClick={loadInventory} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Serial</th>
                  <th className="px-4 py-3">Combo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Locker</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading...</td></tr> : 
                 filteredInventory.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-slate-400">No active locks found.</td></tr> :
                 filteredInventory.map((lock, i) => (
                  <tr key={i} className={lock.status === 'assigned' ? 'bg-blue-50/50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 font-bold text-slate-800">{lock.serial}</td>
                    <td className="px-4 py-3 text-slate-600">{lock.combination}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{lock.status}</td>
                    <td className="px-4 py-3 font-semibold">{lock.studentName}</td>
                    <td className="px-4 py-3 text-slate-600">{lock.assignedLocker}</td>
                    <td className="px-4 py-3 text-right">
                      {lock.status === 'assigned' && (
                        <button 
                          onClick={() => handleReturnLock(lock.serial, lock.studentName)}
                          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 rounded-md text-xs font-bold transition-colors"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="max-w-lg space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Name</label>
            <input value={assignData.name} onChange={e => setAssignData({...assignData, name: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. Bethany W." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Locker Room</label>
              <select value={assignData.room} onChange={e => setAssignData({...assignData, room: e.target.value})} className="w-full border p-2 rounded-lg outline-none bg-white">
                <option value="Girls">Girls' Locker Room</option>
                <option value="Boys">Boys' Locker Room</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {assignData.room !== 'Other' && (
              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Area</label>
                  <select value={assignData.letter} onChange={e => setAssignData({...assignData, letter: e.target.value})} className="w-full border p-2 rounded-lg outline-none bg-white">
                    <option value="T">T</option><option value="P">P</option><option value="V">V</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Number</label>
                  <input value={assignData.number} onChange={e => setAssignData({...assignData, number: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500" placeholder="39" />
                </div>
              </div>
            )}
          </div>
          {assignData.room === 'Other' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Explanation</label>
              <input value={assignData.other} onChange={e => setAssignData({...assignData, other: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. Athletics" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">8-Digit Serial Number</label>
            <input value={assignData.serial} onChange={e => setAssignData({...assignData, serial: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500" placeholder="12345678" />
          </div>
          <button onClick={handleAssign} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">Submit Assignment</button>
          
          {assignMsg.text && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${assignMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {assignMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />} {assignMsg.text}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logger' && (
        <div className="max-w-lg space-y-4">
          <form onSubmit={handleLogLock}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Scan / Enter Serial Number</label>
            <div className="flex gap-2">
              <input autoFocus value={logSerial} onChange={e => setLogSerial(e.target.value)} className="flex-1 border-2 border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 font-mono text-lg" placeholder="12345678" />
              <button type="submit" className="bg-emerald-600 text-white px-6 font-bold rounded-lg hover:bg-emerald-700">Add</button>
            </div>
          </form>
          <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className={`p-3 rounded border-l-4 text-sm font-medium ${log.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}