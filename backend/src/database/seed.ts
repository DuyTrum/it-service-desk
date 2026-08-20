import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

export const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding enterprise database...');
    await client.query('BEGIN');

    // 1. Roles
    await client.query(`
      INSERT INTO roles (id, name, description) VALUES
      (1, 'EMPLOYEE', 'Standard enterprise employee who creates support tickets and views assigned assets'),
      (2, 'TECHNICIAN', 'IT Support / Helpdesk technician who resolves tickets and manages hardware assets'),
      (3, 'ADMIN', 'IT Manager / Administrator with full system privileges')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
    `);

    // 2. Departments
    const deptRes = await client.query(`
      INSERT INTO departments (name, code, location) VALUES
      ('Information Technology', 'IT', 'Floor 4 - Tech Wing'),
      ('Human Resources', 'HR', 'Floor 2 - Room 204'),
      ('Finance & Accounting', 'FIN', 'Floor 3 - Room 301'),
      ('Sales & Marketing', 'MKT', 'Floor 2 - Room 210'),
      ('Operations & Logistics', 'OPS', 'Floor 1 - Warehouse Bay')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location
      RETURNING id, code;
    `);

    const deptMap: Record<string, string> = {};
    deptRes.rows.forEach(r => { deptMap[r.code] = r.id; });

    // 3. Password Hashes
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const techPass = await bcrypt.hash('Tech@123', 10);
    const empPass = await bcrypt.hash('Emp@123', 10);

    // 4. Users
    const usersData = [
      { email: 'admin@company.local', pass: adminPass, name: 'Nguyen Van Admin', phone: '0901111111', title: 'IT Director', role: 3, dept: deptMap['IT'] },
      { email: 'tech.duy@company.local', pass: techPass, name: 'Tran Van Duy', phone: '0901234567', title: 'Senior IT Support Specialist', role: 2, dept: deptMap['IT'] },
      { email: 'tech.lan@company.local', pass: techPass, name: 'Le Thi Lan', phone: '0909876543', title: 'Helpdesk Technician', role: 2, dept: deptMap['IT'] },
      { email: 'emp.nam@company.local', pass: empPass, name: 'Pham Hoang Nam', phone: '0912345678', title: 'Senior Accountant', role: 1, dept: deptMap['FIN'] },
      { email: 'emp.mai@company.local', pass: empPass, name: 'Nguyen Thi Mai', phone: '0923456789', title: 'HR Generalist', role: 1, dept: deptMap['HR'] },
      { email: 'emp.minh@company.local', pass: empPass, name: 'Dang Quang Minh', phone: '0934567890', title: 'Marketing Lead', role: 1, dept: deptMap['MKT'] },
    ];

    const userMap: Record<string, string> = {};
    for (const u of usersData) {
      const res = await client.query(`
        INSERT INTO users (email, password_hash, full_name, phone, job_title, role_id, department_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          job_title = EXCLUDED.job_title,
          role_id = EXCLUDED.role_id,
          department_id = EXCLUDED.department_id
        RETURNING id, email;
      `, [u.email, u.pass, u.name, u.phone, u.title, u.role, u.dept]);
      userMap[u.email] = res.rows[0].id;
    }

    // 5. IT Assets
    const assetsData = [
      {
        code: 'AST-LAP-001',
        name: 'Dell Latitude 5430 Business Laptop',
        category: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 5430',
        serial: 'DL5430-8912A',
        purchase: '2024-01-15',
        warranty: '2027-01-15',
        status: 'Assigned',
        user: userMap['emp.nam@company.local'],
        dept: deptMap['FIN'],
        loc: 'Floor 3 - Desk FIN-04',
        ip: '192.168.1.45',
        mac: '00:1A:2B:3C:4D:5E',
        specs: JSON.stringify({ cpu: 'Intel Core i7-1265U (10 Cores, 4.8GHz)', ram: '16GB DDR4 3200MHz', disk: '512GB NVMe M.2 SSD', display: '14.0" FHD IPS' }),
        notes: 'Primary accounting workstation. Encrypted with BitLocker.'
      },
      {
        code: 'AST-LAP-002',
        name: 'Lenovo ThinkPad T14 Gen 3',
        category: 'Laptop',
        brand: 'Lenovo',
        model: 'ThinkPad T14 Gen 3',
        serial: 'TP14-7729B',
        purchase: '2024-03-10',
        warranty: '2027-03-10',
        status: 'Assigned',
        user: userMap['emp.mai@company.local'],
        dept: deptMap['HR'],
        loc: 'Floor 2 - Desk HR-02',
        ip: '192.168.1.46',
        mac: '00:1A:2B:5E:6F:7A',
        specs: JSON.stringify({ cpu: 'AMD Ryzen 7 PRO 6850U (8 Cores, 4.7GHz)', ram: '16GB LPDDR5 6400MHz', disk: '512GB NVMe PCIe 4.0 SSD', display: '14.0" WUXGA Anti-glare' }),
        notes: 'Equipped with HR recruitment and payroll portal access.'
      },
      {
        code: 'AST-LAP-003',
        name: 'Apple MacBook Pro 14 M2 Pro',
        category: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Pro 14 (2023)',
        serial: 'MB14-6631C',
        purchase: '2023-11-20',
        warranty: '2026-11-20',
        status: 'Assigned',
        user: userMap['emp.minh@company.local'],
        dept: deptMap['MKT'],
        loc: 'Floor 2 - Creative Studio',
        ip: '192.168.1.47',
        mac: 'AC:DE:48:12:34:56',
        specs: JSON.stringify({ cpu: 'Apple M2 Pro (10-core CPU, 16-core GPU)', ram: '16GB Unified Memory', disk: '512GB SSD', display: '14.2" Liquid Retina XDR' }),
        notes: 'Adobe Creative Cloud Suite licensed.'
      },
      {
        code: 'AST-DSK-001',
        name: 'HP EliteDesk 800 G6 Tower Workstation',
        category: 'Desktop',
        brand: 'HP',
        model: 'EliteDesk 800 G6',
        serial: 'HPE-9910D',
        purchase: '2023-08-01',
        warranty: '2026-08-01',
        status: 'Assigned',
        user: userMap['tech.duy@company.local'],
        dept: deptMap['IT'],
        loc: 'Floor 4 - IT Helpdesk Bench 1',
        ip: '192.168.1.20',
        mac: '00:1A:2B:9C:8D:7E',
        specs: JSON.stringify({ cpu: 'Intel Core i9-10900 (10 Cores, 5.2GHz)', ram: '32GB DDR4', disk: '1TB NVMe SSD + 2TB SATA HDD', gpu: 'NVIDIA RTX 3060 12GB' }),
        notes: 'IT Diagnostic & Testbed Workstation. Running PC Monitoring Agent.'
      },
      {
        code: 'AST-PRN-001',
        name: 'Canon imageRUNNER ADVANCE DX 2625i',
        category: 'Printer',
        brand: 'Canon',
        model: 'imageRUNNER DX 2625i',
        serial: 'CN-IR2625-01',
        purchase: '2023-05-10',
        warranty: '2026-05-10',
        status: 'Available',
        user: null,
        dept: deptMap['IT'],
        loc: 'Floor 3 - Hallway Station',
        ip: '192.168.1.100',
        mac: '00:00:85:2B:4C:99',
        specs: JSON.stringify({ print_speed: '25 ppm', color: 'Monochrome Multifunction', paper_capacity: '1200 sheets', protocols: 'IPP, RAW, LPR' }),
        notes: 'Shared network multifunction laser printer.'
      },
      {
        code: 'AST-MON-001',
        name: 'Dell UltraSharp U2723QE 27" 4K USB-C Hub Monitor',
        category: 'Monitor',
        brand: 'Dell',
        model: 'UltraSharp U2723QE',
        serial: 'DU-4K-1122',
        purchase: '2024-02-01',
        warranty: '2027-02-01',
        status: 'Assigned',
        user: userMap['emp.nam@company.local'],
        dept: deptMap['FIN'],
        loc: 'Floor 3 - Desk FIN-04',
        ip: null,
        mac: null,
        specs: JSON.stringify({ size: '27-inch', resolution: '3840x2160 IPS Black', connectivity: 'USB-C 90W PD, DisplayPort 1.4, HDMI 2.0' }),
        notes: 'Paired with AST-LAP-001'
      }
    ];

    const assetMap: Record<string, string> = {};
    for (const a of assetsData) {
      const res = await client.query(`
        INSERT INTO assets (asset_code, name, category, brand, model, serial_number, purchase_date, warranty_expires, status, assigned_user_id, department_id, location, ip_address, mac_address, specs, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (asset_code) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          serial_number = EXCLUDED.serial_number,
          status = EXCLUDED.status,
          assigned_user_id = EXCLUDED.assigned_user_id,
          department_id = EXCLUDED.department_id,
          location = EXCLUDED.location,
          ip_address = EXCLUDED.ip_address,
          mac_address = EXCLUDED.mac_address,
          specs = EXCLUDED.specs,
          notes = EXCLUDED.notes
        RETURNING id, asset_code;
      `, [a.code, a.name, a.category, a.brand, a.model, a.serial, a.purchase, a.warranty, a.status, a.user, a.dept, a.loc, a.ip, a.mac, a.specs, a.notes]);
      assetMap[a.code] = res.rows[0].id;

      // Add asset purchase history
      await client.query(`
        INSERT INTO asset_history (asset_id, action, performed_by_user_id, target_user_id, notes)
        VALUES ($1, 'Purchased', $2, NULL, 'Initial procurement and asset tagging')
      `, [res.rows[0].id, userMap['admin@company.local']]);

      if (a.user) {
        await client.query(`
          INSERT INTO asset_history (asset_id, action, performed_by_user_id, target_user_id, notes)
          VALUES ($1, 'Assigned', $2, $3, 'Issued to employee with initial setup completed')
        `, [res.rows[0].id, userMap['tech.duy@company.local'], a.user]);
      }
    }

    // 6. Knowledge Base Categories & 15 Articles
    const kbCategories = [
      { name: 'Network', icon: 'wifi', desc: 'Wi-Fi, Ethernet, VPN, DNS, and Corporate LAN connectivity issues' },
      { name: 'Hardware', icon: 'cpu', desc: 'Computer, laptops, monitors, power supplies, and peripheral troubleshooting' },
      { name: 'Printer', icon: 'printer', desc: 'Network printers, paper jams, print spooler, and scan-to-folder setup' },
      { name: 'Software', icon: 'app-window', desc: 'Operating systems, Office 365, browser crashes, and ERP software' },
      { name: 'Account & Access', icon: 'key', desc: 'Active Directory, email login, MFA, and access permission requests' },
    ];

    const kbCatMap: Record<string, string> = {};
    for (const cat of kbCategories) {
      const res = await client.query(`
        INSERT INTO knowledge_categories (name, description, icon)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, icon = EXCLUDED.icon
        RETURNING id, name;
      `, [cat.name, cat.desc, cat.icon]);
      kbCatMap[cat.name] = res.rows[0].id;
    }

    const kbArticles = [
      // Network (4)
      {
        title: 'Cannot Connect to Corporate Wi-Fi (CORP-SECURE)',
        category: 'Network',
        desc: 'Workstation fails to associate with company 802.1X WPA3 enterprise wireless network.',
        symptoms: 'Wi-Fi status shows "Action Needed", "Can\'t connect to this network", or infinite reconnect loop.',
        causes: 'Expired Active Directory domain credentials, corrupt wireless profile, or Wi-Fi adapter power-saving sleep bug.',
        steps: [
          'Verify your domain account is not locked by testing login at webmail.company.com.',
          'Right-click Wi-Fi icon -> Network & Internet Settings -> Manage Known Networks -> Click "Forget" on CORP-SECURE.',
          'Turn Airplane Mode ON for 10 seconds, then turn it OFF.',
          'Reconnect to CORP-SECURE. Enter your full corporate username (e.g. user@company.local) and current password.',
          'Accept the corporate RADIUS server SSL certificate prompt if displayed.',
          'Open Command Prompt (cmd) and run: ipconfig /renew'
        ],
        escalation: 'If 802.1X handshake fails with "Invalid credentials" after password reset, escalate ticket to Network Administrator for RADIUS/NPS log check.'
      },
      {
        title: 'No Internet Connection (Connected, No Internet)',
        category: 'Network',
        desc: 'Computer is connected via Ethernet cable or Wi-Fi but web pages and internal portals cannot load.',
        symptoms: 'Yellow exclamation mark on network icon in Windows taskbar. Browser displays ERR_INTERNET_DISCONNECTED.',
        causes: 'Stale DHCP lease, conflicting static IP configuration, faulty network patch cable, or proxy misconfiguration.',
        steps: [
          'Check physical cable connection: Ensure the RJ45 Ethernet clip clicks firmly into both PC and wall jack.',
          'Open Command Prompt as Administrator and run: ipconfig /all to verify valid IPv4 address (e.g. 192.168.x.x).',
          'If IP address starts with 169.254.x.x (APIPA), run: ipconfig /release followed by ipconfig /renew.',
          'Reset TCP/IP stack: Run netsh int ip reset and netsh winsock reset.',
          'Verify Windows Proxy Settings: Go to Settings -> Network & Internet -> Proxy -> Ensure "Automatically detect settings" is ON and manual proxy is OFF.',
          'Reboot the computer to apply Winsock reset.'
        ],
        escalation: 'If APIPA 169.254.x.x persists across multiple reboot attempts on wall jack, file High priority ticket for Network Switch port check.'
      },
      {
        title: 'DNS Resolution Failure (ERR_NAME_NOT_RESOLVED)',
        category: 'Network',
        desc: 'Unable to resolve internal corporate hostnames or external websites while pinging raw IP address succeeds.',
        symptoms: 'Pinging 8.8.8.8 works, but pinging internal.company.local or google.com fails with "Ping request could not find host".',
        causes: 'Corrupt local DNS resolver cache, wrong DNS server specified in network adapter, or internal DNS server unreachable.',
        steps: [
          'Open Command Prompt and flush DNS cache: ipconfig /flushdns',
          'Test internal name resolution: nslookup internal.company.local',
          'Verify DNS server IPs in Network Adapter IPv4 properties: Should point to Primary (192.168.1.2) and Secondary (192.168.1.3).',
          'Restart the Windows DNS Client service by running: net stop dnscache && net start dnscache (or reboot).',
          'Clear browser internal DNS cache: In Chrome/Edge navigate to chrome://net-internals/#dns and click "Clear host cache".'
        ],
        escalation: 'If internal domain controllers / DNS servers fail to answer nslookup queries, trigger Critical Network incident.'
      },
      {
        title: 'Corporate VPN Connection Failed (Error 809 / WireGuard Handshake Timeout)',
        category: 'Network',
        desc: 'Remote employees unable to establish secure tunnel to company internal network when working from home.',
        symptoms: 'VPN client hangs on "Connecting...", fails with Error 809 "The network connection between your computer and the VPN server could not be established".',
        causes: 'Home ISP blocking UDP ports 500/4500 (IPsec NAT-T), expired client VPN certificate, or router firewall restrictions.',
        steps: [
          'Verify home internet is operational by visiting public websites.',
          'Ensure you are not connected to a public guest Wi-Fi network that blocks VPN protocols.',
          'Open VPN Client -> Settings -> Verify Gateway address is vpn.company.com.',
          'Toggle VPN protocol from IPsec/IKEv2 to SSL-VPN (Port 443 TCP fallback).',
          'Check system clock: If Windows date/time is desynchronized by > 3 minutes, TOTP 2FA tokens will fail. Sync clock in Windows Settings.',
          'Restart VPN virtual adapter in ncpa.cpl.'
        ],
        escalation: 'If 2FA authentication loops continuously, contact IT Security to re-issue user MFA token seed.'
      },

      // Hardware (4)
      {
        title: 'Computer Does Not Turn On (No Power / Black Screen)',
        category: 'Hardware',
        desc: 'Desktop or laptop completely unresponsive when pressing the power button.',
        symptoms: 'No LED indicator lights, no fan noise, display remains completely black.',
        causes: 'Discharged battery, faulty power adapter/docking station, static flea power retention on motherboard.',
        steps: [
          'For Laptops: Disconnect power adapter, USB-C dock, external monitors, and USB peripherals.',
          'Perform a Hard Reset / Flea Power Drain: Press and hold the power button firmly for 30 seconds.',
          'Plug the OEM AC charger directly into a verified working wall outlet (bypassing power strips).',
          'Observe charging LED indicator: If amber/white light turns on, let charge for 15 minutes before powering on.',
          'For Desktops: Check power cable seated firmly in PSU socket. Ensure PSU I/O toggle switch on back is set to "I" (ON).'
        ],
        escalation: 'If power LED blinks diagnostic code (e.g., 2 amber 3 white for Dell RAM error), bring machine to IT Desk for component diagnostic.'
      },
      {
        title: 'Computer Is Running Extremely Slowly / Freezing',
        category: 'Hardware',
        desc: 'System takes excessive time to open applications, mouse stutters, or 100% CPU/Disk usage.',
        symptoms: 'High fan noise, unresponsive UI, Task Manager shows 100% CPU or 100% Memory consumption.',
        causes: 'Runaway background process (e.g. indexing, malware, memory leak), insufficient RAM, or thermal CPU throttling.',
        steps: [
          'Press Ctrl + Shift + Esc to open Task Manager. Click "More details" and sort processes by CPU and Memory.',
          'Identify culprit process. If a non-essential app (e.g. browser tab or background updater) is consuming 90%+, select it and click "End Task".',
          'Check Startup Apps tab in Task Manager: Disable unnecessary auto-start software.',
          'Verify free disk space on Drive C: Ensure at least 15% free space for virtual memory swap paging.',
          'Check device vents for dust blockage causing thermal throttling. Place laptop on a hard, flat surface.',
          'Perform a clean Windows restart (Click Start -> Power -> Restart, do NOT just close laptop lid).'
        ],
        escalation: 'If memory usage remains at 95%+ under normal office workload, request hardware upgrade ticket for 16GB -> 32GB RAM.'
      },
      {
        title: 'Low Disk Space Warning on System Drive (C: Drive Full)',
        category: 'Hardware',
        desc: 'Drive C has less than 5GB remaining, causing Windows update failures and crash dumps.',
        symptoms: 'Red storage bar in File Explorer, popup "Low Disk Space", inability to save files or download email attachments.',
        causes: 'Accumulated Windows Temp files, previous Windows update backup caches, large user Downloads folder, or Outlook OST cache.',
        steps: [
          'Press Win + R, type %temp% and press Enter. Select all files (Ctrl + A) and Delete (Shift + Del).',
          'Press Win + R, type temp and delete contents.',
          'Run Windows built-in Disk Cleanup tool: Run cleanmgr.exe as Administrator, check "Clean up system files", select "Temporary files" and "Previous Windows installations".',
          'Empty the Recycle Bin.',
          'Review Downloads folder and move large ISOs/videos to corporate OneDrive cloud storage.',
          'Compact Outlook data file if .ost is larger than 25GB.'
        ],
        escalation: 'If C: drive is under 128GB capacity and cannot be freed further, submit IT Asset ticket for SSD clone upgrade to 512GB NVMe.'
      },
      {
        title: 'External Monitor Not Detected via HDMI / USB-C Dock',
        category: 'Hardware',
        desc: 'Secondary display shows "No Signal" or enters sleep mode when connected to laptop.',
        symptoms: 'Display Settings only detects Display 1. External Dell/LG monitor remains dark or displays "No Video Input".',
        causes: 'Loose video cable, display input source set to incorrect port, outdated Intel/AMD display drivers, or dock power glitch.',
        steps: [
          'Press Windows Key + P and ensure projection mode is set to "Extend" (not "PC screen only").',
          'Check monitor input source using physical buttons on monitor bezel: Switch input explicitly to HDMI 1 or DisplayPort.',
          'Power cycle the Docking Station: Disconnect USB-C cable from laptop, unplug dock power brick for 15s, re-plug power, then reconnect to laptop.',
          'Try pressing Ctrl + Shift + Win + B to restart Windows graphics subsystem (screen will blink once with a beep).',
          'Test video cable directly connected to laptop without using adapter dongles.'
        ],
        escalation: 'If monitor fails with multiple laptops and cables, tag monitor asset as Broken and issue replacement unit from IT stock.'
      },

      // Printer (2)
      {
        title: 'Network Printer Shows "Offline" Status',
        category: 'Printer',
        desc: 'Windows Devices & Printers displays printer icon grayed out with status "Offline".',
        symptoms: 'Documents sent to print queue fail to print with error "Printer offline".',
        causes: 'Printer entered deep sleep mode, printer IP address changed by DHCP, or SNMP status check misconfigured.',
        steps: [
          'Check physical printer panel: Ensure printer is awake and ready with green power light (not in error / paper out).',
          'Ping the printer IP address (e.g. ping 192.168.1.100). If ping fails, check printer Ethernet cable or restart printer.',
          'Open Control Panel -> Devices and Printers -> Double click printer -> Click Printer menu -> Uncheck "Use Printer Offline".',
          'Disable SNMP Status: Right-click printer -> Printer Properties -> Ports tab -> Configure Port -> Uncheck "SNMP Status Enabled" -> Click OK.',
          'Restart the Windows Print Spooler service.'
        ],
        escalation: 'If printer cannot be reached over IP by any workstation on subnet, file ticket for IT Network on-site inspection.'
      },
      {
        title: 'Print Queue Stuck (Document Pending Deletion Loop)',
        category: 'Printer',
        desc: 'A corrupted print job blocks all subsequent documents in the print queue.',
        symptoms: 'Document shows "Deleting..." or "Error - Printing" and cannot be cancelled or deleted via GUI.',
        causes: 'Corrupted print spooler buffer file (.SHD / .SPL) locked by Windows system process.',
        steps: [
          'Open Command Prompt as Administrator.',
          'Stop the Print Spooler service by running: net stop spooler',
          'Delete all cached spooler temp files: del /Q /F /S "%systemroot%\\System32\\Spool\\Printers\\*.*"',
          'Start the Print Spooler service by running: net start spooler',
          'Open print queue again: verify queue is now completely clean (0 documents pending).',
          'Resend the print job.'
        ],
        escalation: 'If spooler crashes repeatedly (Event ID 7031), re-install clean Type 4 PCL6 driver from manufacturer.'
      },

      // Software (2)
      {
        title: 'Application Cannot Open / Immediately Crashes on Launch',
        category: 'Software',
        desc: 'Enterprise desktop software (e.g., ERP, Microsoft Outlook, Teams) fails to launch with no error message.',
        symptoms: 'Clicking program icon shows brief loading cursor then nothing happens, or splash screen hangs indefinitely.',
        causes: 'Corrupted user profile configuration cache, orphaned background process instance, or missing Visual C++ Redistributable.',
        steps: [
          'Open Task Manager (Ctrl + Shift + Esc) -> Look for background processes matching the application name and click "End Task".',
          'Try launching the app in Safe Mode (For Outlook: Win + R -> outlook.exe /safe).',
          'Perform an Office Quick Repair: Settings -> Installed Apps -> Microsoft 365 -> Modify -> Quick Repair.',
          'Check for pending Windows Updates: Settings -> Windows Update -> Check for updates and reboot.',
          'Clear application cache folder in %localappdata% and %appdata%.'
        ],
        escalation: 'If crash generates Event ID 1000 (Application Error in Event Viewer), capture crash log and assign to Tier 2 Software Support.'
      },
      {
        title: 'Application Keeps Crashing with "Out of Memory" Error',
        category: 'Software',
        desc: 'Browser tabs or data analytics software crash with code RESULT_CODE_KILLED_BAD_MESSAGE or STATUS_ACCESS_VIOLATION.',
        symptoms: 'Chrome / Edge displays "Aw, Snap! Out of Memory" when processing large spreadsheets or multiple tabs.',
        causes: 'Excessive browser extensions, 32-bit application limitation, disabled Windows pagefile (Virtual Memory).',
        steps: [
          'Close unused heavy browser tabs and disable third-party unauthorized browser extensions.',
          'Enable Hardware Acceleration in browser settings (or toggle it off if GPU driver is unstable).',
          'Verify Windows Virtual Memory (Pagefile) setting: sysdm.cpl -> Advanced -> Performance Settings -> Advanced -> Virtual Memory -> Ensure "Automatically manage paging file size for all drives" is checked.',
          'Update browser to the latest enterprise build.'
        ],
        escalation: 'For custom ERP apps requiring 64-bit architecture deployment, file ticket with Enterprise App team.'
      },

      // Account & Access (3)
      {
        title: 'Cannot Log In to Windows Workstation (Bad Username or Password)',
        category: 'Account & Access',
        desc: 'User locked out of Windows login screen with error "The referenced account is currently locked out".',
        symptoms: 'Windows displays "Your account has been locked. Contact your administrator to unlock it."',
        causes: 'Exceeded maximum failed password attempts (5 attempts threshold), mobile device trying old cached password on corporate Wi-Fi.',
        steps: [
          'Verify Caps Lock and Num Lock keys are not inadvertently enabled.',
          'Ensure the domain prefix is correct: username should be entered as DOMAIN\\username or user@company.local.',
          'Check if smartphone/tablet Wi-Fi or email client is repeatedly sending an expired saved password: Turn off Wi-Fi on phone.',
          'Wait 15 minutes for automatic Active Directory lockout policy unlock timer.',
          'If immediate access is required, contact IT Helpdesk hotline for identity verification and manual AD unlock.'
        ],
        escalation: 'Technician opens Active Directory Users & Computers -> Finds user -> Unchecks "Account is locked out".'
      },
      {
        title: 'Standard Password Reset SOP & Self-Service Portal Guide',
        category: 'Account & Access',
        desc: 'Procedure for employees to reset expired or forgotten corporate Active Directory passwords.',
        symptoms: 'Prompted with "Your password has expired and must be changed" upon login.',
        causes: '90-day password rotation policy compliance.',
        steps: [
          'Visit corporate Self-Service Password Portal at https://password.company.com on any browser or mobile phone.',
          'Enter your corporate email and verify identity via Microsoft Authenticator Push notification or SMS code.',
          'Create a new password that satisfies corporate complexity requirements: Minimum 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.',
          'Password cannot contain your first name, last name, or previous 5 historical passwords.',
          'Once reset is confirmed, update your password on all registered mobile devices (Outlook app, Wi-Fi profile).'
        ],
        escalation: 'If user lacks mobile 2FA device, Technician must verify identity via video call before executing manual password reset.'
      },
      {
        title: 'Folder Access Permission & Network Share Authorization Request',
        category: 'Account & Access',
        desc: 'Requesting read/write access to shared department network drive (e.g. Z:\\ Shared Drive).',
        symptoms: 'User receives "Windows cannot access \\\\fileserver\\Department. You do not have permission to access".',
        causes: 'User not a member of the required Active Directory Security Group.',
        steps: [
          'Identify the exact network path required (e.g., \\\\fs01.company.local\\Finance\\Reports).',
          'Obtain written email approval from Department Manager / Data Owner.',
          'Submit IT Service Request with ticket category "Account & Access" attaching Manager approval.',
          'Upon IT processing, log off Windows and log back in to renew Kerberos security group tokens (or run: klist purge in cmd).'
        ],
        escalation: 'IT Admin adds user to corresponding AD Security Group (e.g. SG-FINANCE-RW) and updates ticket audit history.'
      }
    ];

    for (const article of kbArticles) {
      await client.query(`
        INSERT INTO knowledge_base (
          title, category_id, problem_description, symptoms, possible_causes,
          troubleshooting_steps, escalation_condition, author_id, view_count, is_published
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
      `, [
        article.title,
        kbCatMap[article.category],
        article.desc,
        article.symptoms,
        article.causes,
        JSON.stringify(article.steps),
        article.escalation,
        userMap['admin@company.local'],
        Math.floor(Math.random() * 50) + 10
      ]);
    }

    // 7. Seed Sample Support Tickets with full lifecycle
    const ticketsData = [
      {
        code: 'TKT-2026-0001',
        title: 'Laptop displays Blue Screen (BSOD) intermittently during financial close',
        desc: 'My Dell Latitude 5430 crashed 3 times today with MEMORY_MANAGEMENT BSOD error while working in Excel.',
        cat: 'Hardware',
        priority: 'High',
        status: 'In Progress',
        creator: userMap['emp.nam@company.local'],
        tech: userMap['tech.duy@company.local'],
        asset: assetMap['AST-LAP-001'],
        dept: deptMap['FIN'],
        comments: [
          { user: userMap['tech.duy@company.local'], text: 'Hello Nam, I am analyzing the minidump file from AST-LAP-001 right now.', is_internal: false },
          { user: userMap['tech.duy@company.local'], text: 'Internal Note: Minidump indicates faulty memory bank at 0x7FFF32. Will replace 8GB RAM stick.', is_internal: true }
        ]
      },
      {
        code: 'TKT-2026-0002',
        title: 'Floor 3 Network Canon Printer is Offline',
        desc: 'None of the HR and Finance team members can print payroll slips to the Canon DX 2625i.',
        cat: 'Printer',
        priority: 'Critical',
        status: 'Open',
        creator: userMap['emp.mai@company.local'],
        tech: null,
        asset: assetMap['AST-PRN-001'],
        dept: deptMap['HR'],
        comments: []
      },
      {
        code: 'TKT-2026-0003',
        title: 'Cannot connect to Corporate VPN from home office',
        desc: 'Getting Error 809 when connecting to vpn.company.com via home fiber connection.',
        cat: 'Network',
        priority: 'Medium',
        status: 'Resolved',
        creator: userMap['emp.minh@company.local'],
        tech: userMap['tech.lan@company.local'],
        asset: assetMap['AST-LAP-003'],
        dept: deptMap['MKT'],
        resolution_notes: 'Switched client tunnel configuration to SSL-VPN Port 443 TCP fallback. Tested speed test and ERP reachability successfully.',
        root_cause: 'Home ISP Viettel was filtering UDP Port 500 IPsec handshake packets.',
        rating: 5,
        feedback: 'Super fast support from Lan, worked right away!',
        resolved_at: new Date(Date.now() - 3600000),
        comments: [
          { user: userMap['tech.lan@company.local'], text: 'Hi Minh, I have enabled SSL-VPN mode on your account profile. Please try connecting now.', is_internal: false }
        ]
      },
      {
        code: 'TKT-2026-0004',
        title: 'Access permission request for Marketing Shared Drive',
        desc: 'Need read/write access to folder \\\\fs01\\Marketing\\Campaigns_2026 for new intern onboarding.',
        cat: 'Account & Access',
        priority: 'Low',
        status: 'Closed',
        creator: userMap['emp.minh@company.local'],
        tech: userMap['tech.duy@company.local'],
        asset: null,
        dept: deptMap['MKT'],
        resolution_notes: 'Added user to Active Directory Security Group SG-MARKETING-RW.',
        root_cause: 'New employee access onboarding process.',
        rating: 5,
        feedback: 'Done promptly, thanks!',
        resolved_at: new Date(Date.now() - 86400000),
        closed_at: new Date(Date.now() - 80000000),
        comments: []
      }
    ];

    for (const t of ticketsData) {
      const ticketRes = await client.query(`
        INSERT INTO tickets (
          ticket_code, title, description, category, priority, status,
          created_by_user_id, assigned_tech_id, asset_id, department_id,
          resolution_notes, root_cause, satisfaction_rating, feedback_comment,
          resolved_at, closed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (ticket_code) DO UPDATE SET
          status = EXCLUDED.status,
          assigned_tech_id = EXCLUDED.assigned_tech_id
        RETURNING id, ticket_code;
      `, [
        t.code, t.title, t.desc, t.cat, t.priority, t.status,
        t.creator, t.tech, t.asset, t.dept,
        t.resolution_notes || null, t.root_cause || null, t.rating || null, t.feedback || null,
        t.resolved_at || null, t.closed_at || null
      ]);

      const ticketId = ticketRes.rows[0].id;

      // Add initial creation history
      await client.query(`
        INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
        VALUES ($1, $2, 'status', NULL, 'Open', 'Ticket created by user')
      `, [ticketId, t.creator]);

      if (t.tech) {
        await client.query(`
          INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
          VALUES ($1, $2, 'assigned_tech_id', NULL, $3, 'Assigned technician')
        `, [ticketId, userMap['admin@company.local'], t.tech]);
      }

      if (t.status === 'In Progress') {
        await client.query(`
          INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
          VALUES ($1, $2, 'status', 'Open', 'In Progress', 'Technician started working on incident')
        `, [ticketId, t.tech]);
      }

      // Add comments
      for (const c of t.comments) {
        await client.query(`
          INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal_note)
          VALUES ($1, $2, $3, $4)
        `, [ticketId, c.user, c.text, c.is_internal]);
      }
    }

    // 8. Device Health Telemetry & Alerts
    await client.query(`
      INSERT INTO device_health_logs (asset_id, hostname, os_info, cpu_usage, ram_usage, disk_usage, ip_address, mac_address, network_status, uptime_seconds)
      VALUES
      ($1, 'DUY-PC-WORKSTATION', 'Windows 11 Pro 64-bit (23H2)', 42.5, 68.2, 91.4, '192.168.1.20', '00:1A:2B:9C:8D:7E', 'online', 345600),
      ($2, 'NAM-FINANCE-LAPTOP', 'Windows 11 Pro 64-bit (23H2)', 18.0, 52.1, 45.8, '192.168.1.45', '00:1A:2B:3C:4D:5E', 'online', 86400),
      ($3, 'MAI-HR-THINKPAD', 'Windows 11 Pro 64-bit (23H2)', 25.4, 48.9, 62.3, '192.168.1.46', '00:1A:2B:5E:6F:7A', 'online', 172800)
    `, [assetMap['AST-DSK-001'], assetMap['AST-LAP-001'], assetMap['AST-LAP-002']]);

    // System Alert for High Disk Usage
    await client.query(`
      INSERT INTO system_alerts (asset_id, alert_type, severity, message, is_resolved)
      VALUES
      ($1, 'DISK_HIGH', 'Warning', 'DUY-PC-WORKSTATION System Drive C: usage is 91.4% (Threshold > 85%)', FALSE)
    `, [assetMap['AST-DSK-001']]);

    // Notifications
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, link_url, is_read)
      VALUES
      ($1, 'High Disk Usage Warning', 'Device DUY-PC-WORKSTATION has reached 91.4% disk capacity.', 'ALERT', '/monitoring', FALSE),
      ($2, 'New Support Ticket Assigned', 'You have been assigned to Ticket #TKT-2026-0001 (BSOD RAM Issue).', 'TICKET', '/tickets', FALSE)
    `, [userMap['tech.duy@company.local'], userMap['tech.duy@company.local']]);

    await client.query('COMMIT');
    console.log('✅ Enterprise database seeded successfully with users, assets, KB articles, tickets, and alerts!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
