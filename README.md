# TANGPARK SURVEY
This project requires [**GraphicsMagick**](https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/1.3.35/) and [**Ghostscript**](https://www.npackd.org/p/com.ghostscript.Ghostscript/9.52) to convert PDF file to jpeg.

### Use on NodeJs

> npm start -- -m=[*mode*] [-s=*separate_file*] [-t] [-d]

- mode: [ 'potential', 'mapping' ]
- separate_file: [ 'file', 'date' ]
- use -t for named file with date string
- use -d for saving temporary files(pdf, json, excel)

---
## Troubleshooting:
- Error: gm convert: No decode delegate for this image format.
  - gm and gs need same architecture like x86, x64.
  - Is gs register correct?
    - "Computer\HKEY_LOCAL_MACHINE\SOFTWARE\GPL Ghostscript\\*version*\\".
    - gs version **must not** contain revision version digit.
    - Does GPL Ghostscript\version contain these string keys:
    - ```
      - GS_DLL = "C:\Program Files (x86)\gs\gs9.52\bin\gsdll32.dll"
      - GS_LIB = "C:\Program Files (x86)\gs\gs9.52\bin; C:\Program Files (x86)\gs\gs9.52\lib;"
      ```
  - ```
    Note:
    - gm convert -version: will show Ghostscript (Library) is not support. But everything works fine.
    - ghostscript can be gswin32 or gswin64, so don't have to change their name.
    ```

- [Error: VipsJpeg: Invalid SOS parameters for sequential JPEG](https://github.com/lovell/sharp/issues/1578)
  - Some camera firmwares make invalid JPEG. Just add sharp's options { failOnError: false } to ignore invalid info parts. 
---
## License
[MIT](LICENSE)