# Troubleshooting Workflows (Standard Operating Procedures)

This directory outlines the 15 enterprise troubleshooting workflows included in the **Knowledge Base** module:

## Category 1: Network & Connectivity
1. **Cannot Connect to Corporate Wi-Fi (CORP-SECURE)**
   * *Resolution*: Clear expired 802.1X certificates, forget wireless network profile, flush DHCP lease with `ipconfig /renew`.
2. **No Internet Connection (Connected, No Internet)**
   * *Resolution*: Check Ethernet cable, detect APIPA 169.254.x.x, reset TCP/IP stack (`netsh winsock reset`), verify manual proxy disabled.
3. **DNS Resolution Failure (ERR_NAME_NOT_RESOLVED)**
   * *Resolution*: Flush DNS resolver cache (`ipconfig /flushdns`), check Primary & Secondary DNS server addresses, restart Windows DNS Client service.
4. **Corporate VPN Connection Failed (Error 809 / Handshake Timeout)**
   * *Resolution*: Fallback to SSL-VPN Port 443 TCP, check system clock time sync for 2FA TOTP tokens, reinitialize virtual TAP adapter.

## Category 2: Hardware & Endpoints
5. **Computer Does Not Turn On (No Power / Black Screen)**
   * *Resolution*: Perform 30-second flea power drain hard reset, inspect charging LED indicator, test OEM charger directly into wall outlet.
6. **Computer Running Slowly / High CPU / Freeze**
   * *Resolution*: Task Manager process sorting, disable non-essential startup items, check Drive C virtual memory swap space, inspect vents for thermal throttling.
7. **Low Disk Space Warning (Drive C: Full)**
   * *Resolution*: Clean `%temp%`, execute `cleanmgr.exe` with System Files option, compact Outlook `.ost` data files, migrate downloads to corporate cloud.
8. **External Monitor Not Detected (HDMI / USB-C Dock)**
   * *Resolution*: Win + P projection to "Extend", power cycle docking station, restart Windows Graphics subsystem with `Ctrl + Shift + Win + B`.

## Category 3: Printing Infrastructure
9. **Network Printer Shows Offline**
   * *Resolution*: Verify printer IP ping reachability, uncheck "Use Printer Offline" in spooler, disable SNMP status check on port.
10. **Print Queue Stuck in Deletion Loop**
    * *Resolution*: Stop `spooler` service (`net stop spooler`), delete `System32\Spool\Printers\*.*`, restart `spooler`.

## Category 4: Software & Applications
11. **Application Cannot Open / Immediately Crashes**
    * *Resolution*: Kill orphaned background processes in Task Manager, launch in Safe Mode (`/safe`), run Office Quick Repair tool.
12. **Out of Memory / Browser Crash**
    * *Resolution*: Close heavy background tabs, toggle GPU Hardware Acceleration, verify Windows Virtual Memory paging file size.

## Category 5: Identity, Account & Access
13. **Cannot Log In to Windows Workstation (Account Locked Out)**
    * *Resolution*: Verify Caps Lock, check mobile phone Wi-Fi sending stale credentials, wait 15 min lock timer or unlock via Active Directory console.
14. **Standard Password Reset SOP**
    * *Resolution*: Self-service portal verification via Microsoft Authenticator push notification, create 12+ character compliant password.
15. **Shared Network Drive Access Request**
    * *Resolution*: Submit manager authorization, add user to Active Directory Security Group (e.g. `SG-FINANCE-RW`), run `klist purge` to renew Kerberos ticket.
