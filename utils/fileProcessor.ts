
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataRow, PresentationData, SlideElement, FieldMapping, SystemSettings } from '../types';

/**
 * Função de similaridade para mapeamento automático de campos.
 */
export const findBestMatch = (field: string, headers: string[]): string => {
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const target = normalize(field);
  
  // 1. Busca exata (normalizada)
  const exact = headers.find(h => normalize(h) === target);
  if (exact) return exact;

  // 2. Busca por contenção
  const contains = headers.find(h => normalize(h).includes(target) || target.includes(normalize(h)));
  if (contains) return contains;

  return "";
};

const getTags = (parent: Document | Element, tagName: string): Element[] => {
  const elements = parent.getElementsByTagName("*");
  const results: Element[] = [];
  const lowerTag = tagName.toLowerCase();
  for (let i = 0; i < elements.length; i++) {
    const localName = elements[i].localName || elements[i].tagName.split(':').pop();
    if (localName && localName.toLowerCase() === lowerTag) {
      results.push(elements[i]);
    }
  }
  return results;
};

export const ensureFontIsLoaded = (fontFamily: string) => {
    if (!fontFamily || ['Arial', 'Helvetica', 'Times New Roman', 'Calibri', 'Verdana'].includes(fontFamily)) return;
    const fontId = `font-load-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(fontId)) return;
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
    document.head.appendChild(link);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
};

export const parseDataFile = async (file: File): Promise<{ data: DataRow[], headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) return reject(new Error("Arquivo vazio."));
        const headers = (jsonData[0] as string[]).map(h => h?.trim()).filter(h => h);
        const rows = (jsonData.slice(1) as any[]).map((row, idx) => {
          const rowData: DataRow = { id: idx };
          headers.forEach((header, colIdx) => rowData[header] = row[colIdx] !== undefined ? String(row[colIdx]) : "");
          return rowData;
        });
        resolve({ data: rows, headers });
      } catch (err) { reject(err); }
    };
    reader.readAsBinaryString(file);
  });
};

export const exportToCSV = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const loadPresentation = async (file: File | Blob): Promise<PresentationData> => {
  const zip = await JSZip.loadAsync(file);
  const isDocx = Object.keys(zip.files).some(name => name.startsWith('word/'));
  
  // Dimensões padrão A4 em EMUs (English Metric Units) para visualização consistente
  let width = 7560000; // 210mm
  let height = 10692000; // 297mm

  if (!isDocx) {
    const presentationXml = await zip.file("ppt/presentation.xml")?.async("string");
    if (presentationXml) {
        const doc = new DOMParser().parseFromString(presentationXml, "application/xml");
        const sldSz = getTags(doc, "sldSz")[0];
        if (sldSz) {
            width = parseInt(sldSz.getAttribute("cx") || "10692000");
            height = parseInt(sldSz.getAttribute("cy") || "7560000");
        }
    }
  }

  const slides = isDocx 
    ? [1] 
    : Object.keys(zip.files).filter(name => name.match(/ppt\/slides\/slide\d+\.xml/));

  return { 
      zip, 
      slidesCount: slides.length, 
      width, 
      height, 
      type: isDocx ? 'docx' : 'pptx' 
  };
};

export const getSlideElements = async (presentation: PresentationData, slideIndex: number): Promise<SlideElement[]> => {
    const { zip, width, height, type } = presentation;
    const parser = new DOMParser();
    const elements: SlideElement[] = [];

    if (type === 'docx') {
        const docXml = await zip.file("word/document.xml")?.async("string");
        if (!docXml) return [];
        const doc = parser.parseFromString(docXml, "application/xml");
        const paragraphs = getTags(doc, "p");
        
        paragraphs.forEach((p, idx) => {
            let text = "";
            const runs = getTags(p, "r");
            runs.forEach(r => {
                const t = getTags(r, "t")[0];
                if (t) text += t.textContent || "";
            });

            if (text.trim()) {
                elements.push({
                    id: `word-${idx}`,
                    type: 'text',
                    text: text.trim(),
                    x: 10, y: 5 + (idx * 3.5), w: 80, h: 3,
                    fontSize: 11, color: '#2d3748'
                });
            }
        });
        return elements;
    }

    const slidePath = `ppt/slides/slide${slideIndex}.xml`;
    const relsPath = `ppt/slides/_rels/slide${slideIndex}.xml.rels`;
    const slideXml = await zip.file(slidePath)?.async("string");
    if (!slideXml) return [];

    const slideDoc = parser.parseFromString(slideXml, "application/xml");
    const relsXml = await zip.file(relsPath)?.async("string");
    const relsDoc = relsXml ? parser.parseFromString(relsXml, "application/xml") : null;

    const shapes = getTags(slideDoc, "sp");
    shapes.forEach((sp, idx) => {
        const txBody = getTags(sp, "txBody")[0];
        const xfrm = getTags(sp, "xfrm")[0];
        if (txBody && xfrm) {
            const off = getTags(xfrm, "off")[0];
            const ext = getTags(xfrm, "ext")[0];
            if (off && ext) {
                let text = "";
                let fontSize: number | undefined;
                let color: string | undefined;
                const paragraphs = getTags(txBody, "p");
                paragraphs.forEach((p, pIdx) => {
                    const runs = getTags(p, "r");
                    runs.forEach(r => {
                        const t = getTags(r, "t")[0];
                        if (t) text += t.textContent || "";
                        const rPr = getTags(r, "rPr")[0];
                        if (rPr) {
                            const sz = rPr.getAttribute("sz");
                            if (sz) fontSize = parseInt(sz) / 100;
                            const clr = getTags(rPr, "srgbClr")[0];
                            if (clr) color = `#${clr.getAttribute("val")}`;
                        }
                    });
                    if (pIdx < paragraphs.length - 1) text += "\n";
                });
                if (text.trim()) {
                    elements.push({
                        id: `text-${idx}`, type: 'text', text: text.trim(),
                        x: (parseInt(off.getAttribute("x") || "0") / width) * 100,
                        y: (parseInt(off.getAttribute("y") || "0") / height) * 100,
                        w: (parseInt(ext.getAttribute("cx") || "1") / width) * 100,
                        h: (parseInt(ext.getAttribute("cy") || "1") / height) * 100,
                        fontSize, color
                    });
                }
            }
        }
    });

    const pics = getTags(slideDoc, "pic");
    for (let i = 0; i < pics.length; i++) {
        const pic = pics[i];
        const blip = getTags(pic, "blip")[0];
        const rId = blip?.getAttribute("r:embed") || blip?.getAttribute("r:link");
        if (rId && relsDoc) {
            const relNode = Array.from(relsDoc.getElementsByTagName("Relationship")).find(r => r.getAttribute("Id") === rId);
            const target = relNode?.getAttribute("Target");
            if (target) {
                const imagePath = target.startsWith("..") ? target.replace("..", "ppt") : `ppt/slides/${target}`;
                const imageFile = zip.file(imagePath);
                if (imageFile) {
                    const base64 = await imageFile.async("base64");
                    const ext = imagePath.split('.').pop()?.toLowerCase();
                    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
                    const xfrm = getTags(pic, "xfrm")[0];
                    const off = getTags(xfrm, "off")[0];
                    const extDim = getTags(xfrm, "ext")[0];
                    if (off && extDim) {
                        elements.push({
                            id: `pic-${i}`, type: 'image', src: `data:${mime};base64,${base64}`,
                            x: (parseInt(off.getAttribute("x") || "0") / width) * 100,
                            y: (parseInt(off.getAttribute("y") || "0") / height) * 100,
                            w: (parseInt(extDim.getAttribute("cx") || "1") / width) * 100,
                            h: (parseInt(extDim.getAttribute("cy") || "1") / height) * 100
                        });
                    }
                }
            }
        }
    }
    return elements;
};

const processSlideDOM = (doc: Document, dataRow: DataRow, mapping: FieldMapping) => {
    const textNodes = getTags(doc, "t");
    textNodes.forEach(tNode => {
        let text = tNode.textContent || "";
        let modified = false;
        
        Object.keys(mapping).forEach(field => {
            const placeholder = `{{${field}}}`;
            if (text.includes(placeholder)) {
                const val = String(dataRow[mapping[field]] || '');
                const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                text = text.replace(regex, val);
                modified = true;
            }
        });

        if (modified) {
            tNode.textContent = text;
        }
    });
};

export const generateMergedDocument = async (zip: any, dataRow: DataRow, mapping: FieldMapping, type: 'pptx' | 'docx' = 'pptx'): Promise<Blob> => {
  const rowZip = await JSZip.loadAsync(await zip.generateAsync({ type: 'arraybuffer' }));
  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  const filesToProcess = type === 'docx'
    ? Object.keys(rowZip.files).filter(f => f.startsWith('word/') && f.endsWith('.xml'))
    : Object.keys(rowZip.files).filter(f => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));

  for (const fileName of filesToProcess) {
    const xml = await rowZip.file(fileName)?.async('string');
    if (!xml) continue;
    const doc = parser.parseFromString(xml, "application/xml");
    processSlideDOM(doc, dataRow, mapping);
    rowZip.file(fileName, serializer.serializeToString(doc));
  }

  const mimeType = type === 'docx' 
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

  return await rowZip.generateAsync({ type: 'blob', mimeType });
};

export const generateConcatenatedPPTX = async (templateZip: any, dataRows: DataRow[], mapping: FieldMapping): Promise<Blob> => {
    const masterZip = await JSZip.loadAsync(await templateZip.generateAsync({ type: 'arraybuffer' }));
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const templateSlidePaths = Object.keys(masterZip.files)
        .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => parseInt(a.match(/\d+/)![0]) - parseInt(b.match(/\d+/)![0]));
    
    const templateSlidesData = await Promise.all(templateSlidePaths.map(async (path) => {
        const xml = await masterZip.file(path)?.async("string");
        const relsPath = `ppt/slides/_rels/${path.split('/').pop()}.rels`;
        const rels = await masterZip.file(relsPath)?.async("string");
        return { xml, rels, originalPath: path };
    }));

    const presXmlStr = await masterZip.file("ppt/presentation.xml")?.async("string");
    const presRelsStr = await masterZip.file("ppt/_rels/presentation.xml.rels")?.async("string");
    const contentTypesStr = await masterZip.file("[Content_Types].xml")?.async("string");
    if (!presXmlStr || !presRelsStr || !contentTypesStr) throw new Error("Template inválido.");
    
    const presDoc = parser.parseFromString(presXmlStr, "application/xml");
    const presRelsDoc = parser.parseFromString(presRelsStr, "application/xml");
    const contentTypesDoc = parser.parseFromString(contentTypesStr, "application/xml");
    const sldIdLst = presDoc.getElementsByTagName("p:sldIdLst")[0];
    const typesRoot = contentTypesDoc.documentElement;
    const relsRoot = presRelsDoc.documentElement;

    Array.from(relsRoot.getElementsByTagName("Relationship")).filter(r => r.getAttribute("Target")?.includes("slides/slide")).forEach(r => relsRoot.removeChild(r));
    Array.from(sldIdLst.getElementsByTagName("p:sldId")).forEach(s => sldIdLst.removeChild(s));
    Array.from(typesRoot.getElementsByTagName("Override")).filter(o => o.getAttribute("PartName")?.includes("/ppt/slides/slide")).forEach(o => typesRoot.removeChild(o));
    
    let globalSlideCounter = 1;
    for (let i = 0; i < dataRows.length; i++) {
        for (let tIdx = 0; tIdx < templateSlidesData.length; tIdx++) {
            const slideData = templateSlidesData[tIdx];
            const slideName = `slide${globalSlideCounter}.xml`;
            const slidePath = `ppt/slides/${slideName}`;
            const slideRelsPath = `ppt/slides/_rels/${slideName}.rels`;
            
            const slideDoc = parser.parseFromString(slideData.xml || "", "application/xml");
            processSlideDOM(slideDoc, dataRows[i], mapping);
            
            masterZip.file(slidePath, serializer.serializeToString(slideDoc));
            if (slideData.rels) masterZip.file(slideRelsPath, slideData.rels);

            const rId = `rId${1000 + globalSlideCounter}`;
            const sldId = (256 + globalSlideCounter).toString();
            const sldIdNode = presDoc.createElementNS("http://schemas.openxmlformats.org/presentationml/2006/main", "p:sldId");
            sldIdNode.setAttribute("id", sldId);
            sldIdNode.setAttribute("r:id", rId);
            sldIdLst.appendChild(sldIdNode);

            const relNode = presRelsDoc.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
            relNode.setAttribute("Id", rId);
            relNode.setAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide");
            relNode.setAttribute("Target", `slides/${slideName}`);
            relsRoot.appendChild(relNode);

            const overrideNode = contentTypesDoc.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Override");
            overrideNode.setAttribute("PartName", `/ppt/slides/${slideName}`);
            overrideNode.setAttribute("ContentType", "application/vnd.openxmlformats-officedocument.presentationml.slide+xml");
            typesRoot.appendChild(overrideNode);

            globalSlideCounter++;
        }
    }

    masterZip.file("ppt/presentation.xml", serializer.serializeToString(presDoc));
    masterZip.file("ppt/_rels/presentation.xml.rels", serializer.serializeToString(presRelsDoc));
    masterZip.file("[Content_Types].xml", serializer.serializeToString(contentTypesDoc));
    return await masterZip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
};

export const generateAttendancePDF = async (data: DataRow[], settings: SystemSettings, columnMapping: { name: string, cpf: string }): Promise<Blob> => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'cm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 1.5;
    if (settings.logo) try { doc.addImage(settings.logo, 'PNG', margin, 1.0, 3.5, 1.5); } catch (e) {}
    doc.setFont("Helvetica", "bold").setFontSize(16).text(settings.companyName.toUpperCase(), 6.5, 1.6);
    doc.setFont("Helvetica", "normal").setFontSize(9).text(`Documento emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 6.5, 2.1);
    doc.setLineWidth(0.05).line(margin, 2.8, pageWidth - margin, 2.8);
    doc.setFont("Helvetica", "bold").setFontSize(22).text("LISTA DE PRESENÇA", pageWidth / 2, 4.2, { align: "center" });
    autoTable(doc, {
        startY: 5.5,
        margin: { left: margin, right: margin },
        head: [['#', 'NOME DO PARTICIPANTE', 'CPF', 'ASSINATURA']],
        body: data.map((row, idx) => [idx + 1, String(row[columnMapping.name] || '').toUpperCase(), String(row[columnMapping.cpf] || ''), '']),
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', lineWidth: 0.02, halign: 'center' },
        styles: { fontSize: 9, cellPadding: 0.3, lineWidth: 0.02, lineColor: [150, 150, 150] },
        columnStyles: { 0: { cellWidth: 1.0, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 3.5, halign: 'center' }, 3: { cellWidth: 7.0 } },
    });
    return doc.output('blob');
};

export const formatCPF = (v: string) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").substring(0, 14);
export const formatCNPJ = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").substring(0, 18);
export const formatRG = (v: string) => v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").substring(0, 12);
export const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").substring(0, 9);
export const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").substring(0, 15);
