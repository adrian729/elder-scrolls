# Font credits

These files are copied without modification from the typography used in [Polyhymnia](https://github.com/adrian729/app). All font software is licensed under **SIL Open Font License 1.1**, separately from this repository's MIT code/artwork license. License texts and copyright notices are included alongside the files.

| Font | Source / version | License |
| --- | --- | --- |
| Junicode VF Roman and Italic | [Junicode](https://github.com/psb1558/Junicode-font), v2.226 | [Junicode-OFL.txt](Junicode-OFL.txt) |
| Texturina Variable, optical-size/weight axes | [Fontsource Texturina](https://fontsource.org/fonts/texturina), package 5.3.0, `opsz.css` subsets | [Texturina-OFL.txt](Texturina-OFL.txt) |
| EB Garamond Variable | [Fontsource EB Garamond](https://fontsource.org/fonts/eb-garamond), package 5.3.0, normal weight-axis subsets | [EB-Garamond-OFL.txt](EB-Garamond-OFL.txt) |
| EB Garamond Initials Fill1 / Fill2 | [EB Garamond Initials](https://github.com/georgd/EB-Garamond-Initials), app's A–Z WOFF2 subset | [EB-Garamond-Initials-OFL.txt](EB-Garamond-Initials-OFL.txt) |
| JetBrains Mono Variable | [Fontsource JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono), package 5.3.0, normal weight-axis subsets | [JetBrains-Mono-OFL.txt](JetBrains-Mono-OFL.txt) |

`src/fonts.css` retains the app's face declarations, Unicode ranges, and source provenance. The Latin demo normally loads Junicode Roman, Latin Texturina, Latin EB Garamond, and both initials layers. Other language subsets, italic Junicode, and mono load only when used. No font CDN or build-time network access is required.
