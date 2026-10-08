import os

target = None
for p in ['frontend/src/App.jsx', 'src/App.jsx', 'App.jsx']:
    if os.path.exists(p):
        target = p
        break

if not target:
    print('Error: Could not locate App.jsx. Make sure fix.py is in yieldsense-ai folder.')
    exit(1)

with open(target, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the entire Demo Portals section with clean highlights & proper </div> tags
m1_text = 'All-India Multi-Crop Agricultural Network & Agro-Climatic Zones'
m2_text = '{/* Right Section: The Commercial Login Card */}'

idx1 = content.find(m1_text)
idx2 = content.find(m2_text)

if idx1 != -1 and idx2 != -1:
    clean_middle = """All-India Multi-Crop Agricultural Network & Agro-Climatic Zones</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Random Forest Regressor | Multi-Crop Yield Predictions Across 16+ Indian States | MSP Analytics</div>
                </div>
              </div>

              {/* Enterprise Security & Agronomic Intelligence Highlights */}
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
              </div>
            </div>

            """
    content = content[:idx1] + clean_middle + content[idx2:]
    print("Cleaned Left Portal Box successfully!")

# 2. Remove Quick-Fill Pills in login form if present
f_start = content.find('<form onSubmit={handleLoginSubmit}>')
f_input = content.find('name="yield_login_usr"')

if f_start != -1 and f_input != -1 and f_start < f_input:
    clean_form_header = """<form onSubmit={handleLoginSubmit}>

                  {/* Anti-autofill dummy inputs for browser password managers */}
                  <input type="text" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" readOnly />
                  <input type="password" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" readOnly />

                  <div style={{ marginBottom: '14px' }}>
                    <input
                      """
    content = content[:f_start] + clean_form_header + content[f_input:]
    print("Cleaned Quick-Fill pills from login form!")

with open(target, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: App.jsx updated and all JSX tags balanced!")