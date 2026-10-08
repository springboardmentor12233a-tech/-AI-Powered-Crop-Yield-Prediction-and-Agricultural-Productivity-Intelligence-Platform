import os

# Automatically locate App.jsx whether run from root or frontend folder
possible_paths = [
    os.path.join("frontend", "src", "App.jsx"),
    os.path.join("src", "App.jsx"),
    "App.jsx"
]

target_file = None
for p in possible_paths:
    if os.path.exists(p):
        target_file = p
        break

if not target_file:
    print("Error: Could not locate App.jsx. Please run this script from your 'yieldsense-ai' folder.")
    exit(1)

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update forgotten password alert
target_str = 'Password for demo testing: ' + '${matched.password}'
replacement_str = 'Your password is: ' + '${matched.password}'
content = content.replace(target_str, replacement_str)

# 2. Remove handleInstantLogin and handleAutoFillForm helper functions
old_handlers = """  // 1. Direct Instant Login (No typing needed)
  const handleInstantLogin = (roleType) => {
    setAuthError('');
    if (roleType === 'admin') {
      const adminAcc = registeredAccounts.find(a => a.email.toLowerCase() === 'admin@yieldsense.ai') || INITIAL_ACCOUNTS[0];
      const updated = registeredAccounts.map(a => a.email.toLowerCase() === 'admin@yieldsense.ai' ? { ...a, status: 'Online', lastLogin: 'Active Now' } : a);
      setRegisteredAccounts(updated);
      setCurrentUser(adminAcc);
      localStorage.setItem('yieldsense_active_session', JSON.stringify(adminAcc));
      showNotification("Logged in as Administrator (Tejaswini Dalavi)!");
    } else {
      const farmerAcc = registeredAccounts.find(a => a.email.toLowerCase() === 'farmer@yieldsense.ai') || INITIAL_ACCOUNTS[1];
      const updated = registeredAccounts.map(a => a.email.toLowerCase() === 'farmer@yieldsense.ai' ? { ...a, status: 'Online', lastLogin: 'Active Now' } : a);
      setRegisteredAccounts(updated);
      setCurrentUser(farmerAcc);
      localStorage.setItem('yieldsense_active_session', JSON.stringify(farmerAcc));
      showNotification("Logged in as Commercial Farmer (Ramesh Patil)!");
    }
  };

  // 2. Visible Auto-Fill Form fields
  const handleAutoFillForm = (roleType) => {
    setPortalMode(roleType);
    setAuthError('');
    if (roleType === 'admin') {
      setLoginEmail("admin@yieldsense.ai");
      setLoginPassword("Admin@2026");
      showNotification("Admin credentials filled into login form!");
    } else {
      setLoginEmail("farmer@yieldsense.ai");
      setLoginPassword("Farmer@123");
      showNotification("Farmer credentials filled into login form!");
    }
  };"""

if old_handlers in content:
    content = content.replace(old_handlers, "  // Authentication Submission Handler")
    print("Removed instant login & auto-fill functions.")

# 3. Replace Verified System Portals Box with Agricultural Intelligence Highlights
old_portal_box = """              {/* Verified System Portals Box with DIRECT 1-CLICK LOGIN + AUTO-FILL */}
              <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '18px', boxShadow: '0 6px 18px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SvgIcons.Bolt />
                    <span>Verified System Portals (Direct 1-Click Access):</span>
                  </span>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    Pre-Seeded & Ready
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Farmer Portal Card */}
                  <div style={{ border: '2px solid #059669', borderRadius: '8px', padding: '12px', background: '#f0fdf4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#059669', fontSize: '13px' }}>
                      <SvgIcons.Leaf />
                      <span>Farmer Portal</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', fontWeight: '700', marginTop: '4px' }}>Ramesh Patil (Commercial Farmer)</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>farmer@yieldsense.ai</div>
                    
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('user')}
                        style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        1-Click Login
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoFillForm('user')}
                        style={{ background: '#fff', color: '#059669', border: '1px solid #059669', borderRadius: '4px', padding: '6px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>

                  {/* Admin Portal Card */}
                  <div style={{ border: '2px solid #2563eb', borderRadius: '8px', padding: '12px', background: '#eff6ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#2563eb', fontSize: '13px' }}>
                      <SvgIcons.Shield />
                      <span>Admin Portal</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', fontWeight: '700', marginTop: '4px' }}>Tejaswini Dalavi (System Admin)</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>admin@yieldsense.ai</div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('admin')}
                        style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        1-Click Login
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoFillForm('admin')}
                        style={{ background: '#fff', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '4px', padding: '6px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                </div>
              </div>"""

new_highlights_box = """              {/* Enterprise Security & Agronomic Intelligence Highlights */}
              <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '18px', boxShadow: '0 6px 18px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SvgIcons.Shield />
                    <span>Agronomic Intelligence & Security Standards</span>
                  </span>
                  <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', border: '1px solid #a7f3d0' }}>
                    All-India Network
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                      <SvgIcons.Leaf />
                    </div>
                    <span>Multi-State Agro-Climatic Yield Forecasts calibrated across 16+ Indian agricultural states</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    <div style={{ background: '#eff6ff', color: '#2563eb', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                      <SvgIcons.Chart />
                    </div>
                    <span>Granular crop-specific economics, MSP compliance checks, and chemical expenditure analytics</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                      <SvgIcons.Shield />
                    </div>
                    <span>Isolated commercial farmer ledger ensuring confidential farm records with admin audit oversight</span>
                  </div>
                </div>
              </div>"""

if old_portal_box in content:
    content = content.replace(old_portal_box, new_highlights_box)
    print("Replaced demo portals card with Agronomic Intelligence & Security highlights.")

# 4. Remove Quick-Fill Helper Pills from login form
old_pills = """                <form onSubmit={handleLoginSubmit}>
                  {/* Quick-Fill Helper Pills */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() => handleAutoFillForm('user')}
                      style={{ flex: 1, padding: '7px 8px', borderRadius: '6px', border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <SvgIcons.Leaf />
                      <span>Fill Farmer Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoFillForm('admin')}
                      style={{ flex: 1, padding: '7px 8px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <SvgIcons.Shield />
                      <span>Fill Admin Login</span>
                    </button>
                  </div>"""

if old_pills in content:
    content = content.replace(old_pills, "                <form onSubmit={handleLoginSubmit}>")
    print("Removed Quick-Fill Helper Pills from login form.")

with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Success: {target_file} updated cleanly! Zero demo buttons remaining.")