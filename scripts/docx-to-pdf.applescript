-- Convert one .docx to PDF using Microsoft Word (high-fidelity).
-- Drives Word via VBA ExportAsFixedFormat so the export preserves every
-- detail of the .docx layout (anchored shapes, headers/footers, fonts).
-- Usage: osascript docx-to-pdf.applescript <input.docx> <output.pdf>
on run argv
	if (count of argv) < 2 then
		error "usage: docx-to-pdf.applescript <input.docx> <output.pdf>"
	end if
	set inputPath to item 1 of argv
	set outputPath to item 2 of argv

	set q to "\""
	set escapedIn to my replaceText(inputPath, q, q & q)
	set escapedOut to my replaceText(outputPath, q, q & q)

	set openStmt to "Set d = Documents.Open(FileName:=" & q & escapedIn & q & ", ReadOnly:=True, Visible:=False)"
	set exportStmt to "d.ExportAsFixedFormat OutputFileName:=" & q & escapedOut & q & ", ExportFormat:=wdExportFormatPDF, OpenAfterExport:=False, OptimizeFor:=wdExportOptimizeForPrint, Range:=wdExportAllDocument, Item:=wdExportDocumentContent, IncludeDocProps:=True, KeepIRM:=True, CreateBookmarks:=wdExportCreateNoBookmarks, DocStructureTags:=True, BitmapMissingFonts:=True, UseISO19005_1:=False"
	set closeStmt to "d.Close SaveChanges:=wdDoNotSaveChanges"

	set vbaCode to "Dim d As Document" & linefeed & openStmt & linefeed & exportStmt & linefeed & closeStmt

	tell application "Microsoft Word"
		do Visual Basic vbaCode
	end tell
end run

on replaceText(s, find, repl)
	set AppleScript's text item delimiters to find
	set parts to text items of s
	set AppleScript's text item delimiters to repl
	set out to parts as text
	set AppleScript's text item delimiters to ""
	return out
end replaceText
