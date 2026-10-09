export type Lang = 'en' | 'te' | 'hi';
export const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'English' }, { code: 'te', label: 'తెలుగు' }, { code: 'hi', label: 'हिन्दी' }];

export const DICT: Record<Lang, Record<string, string>> = {
  en: {
    'NAV.DASH': 'Command Center', 'NAV.VAULT': 'Data Vault', 'NAV.USERS': 'Manage Users', 'NAV.AUDIT': 'Audit Ledger', 'NAV.PIPE': 'Pipeline', 'NAV.LOGOUT': 'Terminate Session',
    'DASH.T1': 'Command', 'DASH.T2': 'Center', 'DASH.WS': 'Custom Workspace', 'DASH.ADD': '+ Add Widget',
    'VAULT.T1': 'Data', 'VAULT.T2': 'Vault', 'VAULT.SUB': 'Encrypted file storage with role-based masking.', 'VAULT.FETCH': 'Fetch Records', 'VAULT.SEARCH': 'Search assets…', 'VAULT.EXPORT': 'Export CSV', 'VAULT.ALL': 'All',
    'USERS.T1': 'User', 'USERS.T2': 'Management', 'USERS.REG': '+ Register Operator',
    'AUDIT.T1': 'Audit', 'AUDIT.T2': 'Ledger',
    'PIPE.T1': 'Verification', 'PIPE.T2': 'Pipeline', 'PIPE.SUB': 'Drag a candidate card to the next stage.',
    'LOGIN.ID': 'Operator ID', 'LOGIN.KEY': 'Security Key', 'LOGIN.ROLE': 'Access Role', 'LOGIN.BTN': 'Initialize Connection', 'LOGIN.DEMO': 'Override / Demo Access',
    'LOGIN.WARN_T': 'Demo Environment', 'LOGIN.WARN_B': 'This is a demonstration website. All data is simulated and no real personal data is used. Sign in with the sample accounts below.',
    'MFA.T': 'Two-Factor Verification', 'MFA.SUB': 'Enter the 6-digit code to continue.', 'MFA.EXP': 'Code expires in', 'MFA.RESEND': 'Resend code', 'MFA.HINT': 'Demo code',
  },
  te: {
    'NAV.DASH': 'కమాండ్ సెంటర్', 'NAV.VAULT': 'డేటా వాల్ట్', 'NAV.USERS': 'వినియోగదారుల నిర్వహణ', 'NAV.AUDIT': 'ఆడిట్ లెడ్జర్', 'NAV.PIPE': 'పైప్‌లైన్', 'NAV.LOGOUT': 'సెషన్ ముగించండి',
    'DASH.T1': 'కమాండ్', 'DASH.T2': 'సెంటర్', 'DASH.WS': 'కస్టమ్ వర్క్‌స్పేస్', 'DASH.ADD': '+ విడ్జెట్ జోడించు',
    'VAULT.T1': 'డేటా', 'VAULT.T2': 'వాల్ట్', 'VAULT.SUB': 'పాత్ర ఆధారిత మాస్కింగ్‌తో ఎన్‌క్రిప్ట్ చేసిన ఫైల్ నిల్వ.', 'VAULT.FETCH': 'రికార్డులు తీసుకురా', 'VAULT.SEARCH': 'ఫైళ్లను వెతకండి…', 'VAULT.EXPORT': 'CSV ఎగుమతి', 'VAULT.ALL': 'అన్నీ',
    'USERS.T1': 'వినియోగదారుల', 'USERS.T2': 'నిర్వహణ', 'USERS.REG': '+ ఆపరేటర్‌ను నమోదు చేయి',
    'AUDIT.T1': 'ఆడిట్', 'AUDIT.T2': 'లెడ్జర్',
    'PIPE.T1': 'ధృవీకరణ', 'PIPE.T2': 'పైప్‌లైన్', 'PIPE.SUB': 'అభ్యర్థి కార్డును తదుపరి దశకు లాగండి.',
    'LOGIN.ID': 'ఆపరేటర్ ID', 'LOGIN.KEY': 'సెక్యూరిటీ కీ', 'LOGIN.ROLE': 'యాక్సెస్ పాత్ర', 'LOGIN.BTN': 'కనెక్షన్ ప్రారంభించండి', 'LOGIN.DEMO': 'డెమో యాక్సెస్',
    'LOGIN.WARN_T': 'డెమో వాతావరణం', 'LOGIN.WARN_B': 'ఇది ఒక డెమో వెబ్‌సైట్. డేటా అంతా కల్పితం, నిజమైన వ్యక్తిగత సమాచారం వాడలేదు. కింది నమూనా ఖాతాలతో సైన్ ఇన్ చేయండి.',
    'MFA.T': 'రెండు-దశల ధృవీకరణ', 'MFA.SUB': 'కొనసాగడానికి 6 అంకెల కోడ్ నమోదు చేయండి.', 'MFA.EXP': 'కోడ్ గడువు', 'MFA.RESEND': 'కోడ్ మళ్లీ పంపు', 'MFA.HINT': 'డెమో కోడ్',
  },
  hi: {
    'NAV.DASH': 'कमांड सेंटर', 'NAV.VAULT': 'डेटा वॉल्ट', 'NAV.USERS': 'उपयोगकर्ता प्रबंधन', 'NAV.AUDIT': 'ऑडिट लेजर', 'NAV.PIPE': 'पाइपलाइन', 'NAV.LOGOUT': 'सेशन समाप्त करें',
    'DASH.T1': 'कमांड', 'DASH.T2': 'सेंटर', 'DASH.WS': 'कस्टम वर्कस्पेस', 'DASH.ADD': '+ विजेट जोड़ें',
    'VAULT.T1': 'डेटा', 'VAULT.T2': 'वॉल्ट', 'VAULT.SUB': 'भूमिका-आधारित मास्किंग के साथ एन्क्रिप्टेड फ़ाइल भंडारण।', 'VAULT.FETCH': 'रिकॉर्ड लाएँ', 'VAULT.SEARCH': 'फ़ाइलें खोजें…', 'VAULT.EXPORT': 'CSV निर्यात', 'VAULT.ALL': 'सभी',
    'USERS.T1': 'उपयोगकर्ता', 'USERS.T2': 'प्रबंधन', 'USERS.REG': '+ ऑपरेटर पंजीकृत करें',
    'AUDIT.T1': 'ऑडिट', 'AUDIT.T2': 'लेजर',
    'PIPE.T1': 'सत्यापन', 'PIPE.T2': 'पाइपलाइन', 'PIPE.SUB': 'उम्मीदवार कार्ड को अगले चरण में खींचें।',
    'LOGIN.ID': 'ऑपरेटर ID', 'LOGIN.KEY': 'सिक्योरिटी की', 'LOGIN.ROLE': 'एक्सेस भूमिका', 'LOGIN.BTN': 'कनेक्शन शुरू करें', 'LOGIN.DEMO': 'डेमो एक्सेस',
    'LOGIN.WARN_T': 'डेमो वातावरण', 'LOGIN.WARN_B': 'यह एक डेमो वेबसाइट है। सारा डेटा काल्पनिक है और कोई वास्तविक व्यक्तिगत जानकारी उपयोग नहीं हुई। नीचे दिए नमूना खातों से साइन इन करें।',
    'MFA.T': 'दो-चरणीय सत्यापन', 'MFA.SUB': 'जारी रखने के लिए 6 अंकों का कोड दर्ज करें।', 'MFA.EXP': 'कोड समाप्त होगा', 'MFA.RESEND': 'कोड दोबारा भेजें', 'MFA.HINT': 'डेमो कोड',
  },
};
