from __future__ import annotations

import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape


PPTX_NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

SLIDE_W = 12192000
SLIDE_H = 6858000

BRAND_PRIMARY = "6D4C82"
BRAND_SECONDARY = "404040"
BRAND_ACCENT = "9B7CAD"
BRAND_LIGHT = "F5F3F7"
BRAND_SOFT = "FCFAFD"
BRAND_GOLD = "D9B86C"
WHITE = "FFFFFF"
SUCCESS = "2E7D5A"
WARNING = "A65F21"
DANGER = "B24C63"
MUTED = "85788F"
LINE = "D9D0DF"

OUTPUT_PATH = Path("release/HachiAi-Management-Presentation.pptx")
LOGO_PATH = Path("public/logo.png")
LOGO_MARK_PATH = Path("public/logo-mark.png")


@dataclass
class ShapeSpec:
    xml: str


def emu(inches: float) -> int:
    return int(round(inches * 914400))


def xml_header() -> str:
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'


def paragraph_xml(
    text: str,
    font_size: int = 18,
    color: str = BRAND_SECONDARY,
    bold: bool = False,
    font_face: str = "Aptos",
    align: str | None = None,
    bullet: bool = False,
    level: int = 0,
    space_before: int | None = None,
    space_after: int | None = None,
) -> str:
    props: list[str] = []
    if align:
        props.append(f'algn="{align}"')
    ppr_bits: list[str] = []
    if bullet:
        ppr_bits.append(f'<a:buChar char="•"/>')
        if level:
            ppr_bits.append(f'<a:buSzPct val="100000"/><a:indent lvl="{level}"/>')
    else:
        ppr_bits.append("<a:buNone/>")
    if space_before is not None or space_after is not None:
        spc = []
        if space_before is not None:
            spc.append(f"<a:spcBef><a:spcPts val=\"{space_before}\"/></a:spcBef>")
        if space_after is not None:
            spc.append(f"<a:spcAft><a:spcPts val=\"{space_after}\"/></a:spcAft>")
        ppr_bits.append("".join(spc))
    ppr = f"<a:pPr {' '.join(props)}>{''.join(ppr_bits)}</a:pPr>" if props or ppr_bits else "<a:pPr/>"
    bold_attr = ' b="1"' if bold else ""
    return (
        "<a:p>"
        f"{ppr}"
        f'<a:r><a:rPr lang="en-US" sz="{font_size * 100}" dirty="0" smtClean="0"{bold_attr}>'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{font_face}"/><a:ea typeface="{font_face}"/><a:cs typeface="{font_face}"/>'
        f"</a:rPr><a:t>{escape(text)}</a:t></a:r>"
        '<a:endParaRPr lang="en-US" sz="1800" dirty="0"/>'
        "</a:p>"
    )


def fit_text_body(
    paragraphs: list[str],
    left: float,
    top: float,
    width: float,
    height: float,
    shape_id: int,
    fill: str | None = None,
    line: str | None = None,
    radius: str = "rect",
    margin_left: int = 120000,
    margin_right: int = 120000,
    margin_top: int = 90000,
    margin_bottom: int = 90000,
) -> ShapeSpec:
    fill_xml = (
        f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>'
        if fill
        else "<a:noFill/>"
    )
    line_xml = (
        f'<a:ln w="12700"><a:solidFill><a:srgbClr val="{line}"/></a:solidFill></a:ln>'
        if line
        else "<a:ln><a:noFill/></a:ln>"
    )
    body = "".join(paragraphs)
    xml = (
        "<p:sp>"
        "<p:nvSpPr>"
        f'<p:cNvPr id="{shape_id}" name="Shape {shape_id}"/>'
        "<p:cNvSpPr txBox=\"1\"/>"
        "<p:nvPr/>"
        "</p:nvSpPr>"
        "<p:spPr>"
        f'<a:xfrm><a:off x="{emu(left)}" y="{emu(top)}"/><a:ext cx="{emu(width)}" cy="{emu(height)}"/></a:xfrm>'
        f'<a:prstGeom prst="{radius}"><a:avLst/></a:prstGeom>'
        f"{fill_xml}{line_xml}"
        "</p:spPr>"
        "<p:txBody>"
        f'<a:bodyPr wrap="square" rtlCol="0" anchor="t" lIns="{margin_left}" tIns="{margin_top}" rIns="{margin_right}" bIns="{margin_bottom}"/>'
        "<a:lstStyle/>"
        f"{body}"
        "</p:txBody>"
        "</p:sp>"
    )
    return ShapeSpec(xml)


def line_shape(shape_id: int, left: float, top: float, width: float, color: str, weight: int = 19050) -> ShapeSpec:
    return ShapeSpec(
        "<p:sp>"
        "<p:nvSpPr>"
        f'<p:cNvPr id="{shape_id}" name="Line {shape_id}"/>'
        "<p:cNvSpPr/>"
        "<p:nvPr/>"
        "</p:nvSpPr>"
        "<p:spPr>"
        f'<a:xfrm><a:off x="{emu(left)}" y="{emu(top)}"/><a:ext cx="{emu(width)}" cy="0"/></a:xfrm>'
        '<a:prstGeom prst="line"><a:avLst/></a:prstGeom>'
        f'<a:ln w="{weight}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill></a:ln>'
        "</p:spPr>"
        "<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang=\"en-US\"/></a:p></p:txBody>"
        "</p:sp>"
    )


def picture_xml(shape_id: int, rel_id: str, left: float, top: float, width: float, height: float, name: str) -> ShapeSpec:
    return ShapeSpec(
        "<p:pic>"
        "<p:nvPicPr>"
        f'<p:cNvPr id="{shape_id}" name="{escape(name)}"/>'
        "<p:cNvPicPr/>"
        "<p:nvPr/>"
        "</p:nvPicPr>"
        "<p:blipFill>"
        f'<a:blip r:embed="{rel_id}"/>'
        "<a:stretch><a:fillRect/></a:stretch>"
        "</p:blipFill>"
        "<p:spPr>"
        f'<a:xfrm><a:off x="{emu(left)}" y="{emu(top)}"/><a:ext cx="{emu(width)}" cy="{emu(height)}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        "</p:spPr>"
        "</p:pic>"
    )


def slide_xml(shapes: list[ShapeSpec]) -> str:
    shape_tree = [
        "<p:nvGrpSpPr>",
        '<p:cNvPr id="1" name=""/>',
        "<p:cNvGrpSpPr/>",
        "<p:nvPr/>",
        "</p:nvGrpSpPr>",
        "<p:grpSpPr>",
        '<a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>',
        "</p:grpSpPr>",
    ]
    shape_tree.extend(shape.xml for shape in shapes)
    return (
        xml_header()
        + '<p:sld xmlns:a="{a}" xmlns:p="{p}" xmlns:r="{r}">'.format(**PPTX_NS)
        + "<p:cSld>"
        + f'<p:bg><p:bgPr><a:solidFill><a:srgbClr val="{BRAND_SOFT}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'
        + f"<p:spTree>{''.join(shape_tree)}</p:spTree>"
        + "</p:cSld>"
        + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'
        + "</p:sld>"
    )


def slide_rels_xml(image_relations: list[tuple[str, str]]) -> str:
    rels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
    ]
    for rel_id, target in image_relations:
        rels.append(
            f'<Relationship Id="{rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/{target}"/>'
        )
    return (
        xml_header()
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + "".join(rels)
        + "</Relationships>"
    )


def content_types_xml(slide_count: int) -> str:
    overrides = [
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
        '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>',
        '<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>',
        '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    for idx in range(1, slide_count + 1):
        overrides.append(
            f'<Override PartName="/ppt/slides/slide{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        )
    return (
        xml_header()
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Default Extension="png" ContentType="image/png"/>'
        + "".join(overrides)
        + "</Types>"
    )


def root_rels_xml() -> str:
    return (
        xml_header()
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        + "</Relationships>"
    )


def app_xml(slide_count: int) -> str:
    titles = "".join(f"<vt:lpstr>Slide {i}</vt:lpstr>" for i in range(1, slide_count + 1))
    return (
        xml_header()
        + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        + 'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        + "<Application>Microsoft Office PowerPoint</Application>"
        + "<PresentationFormat>On-screen Show (16:9)</PresentationFormat>"
        + f"<Slides>{slide_count}</Slides>"
        + "<Notes>0</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips><ScaleCrop>false</ScaleCrop>"
        + '<HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Slides</vt:lpstr></vt:variant>'
        + f"<vt:variant><vt:i4>{slide_count}</vt:i4></vt:variant></vt:vector></HeadingPairs>"
        + f'<TitlesOfParts><vt:vector size="{slide_count}" baseType="lpstr">{titles}</vt:vector></TitlesOfParts>'
        + "<Company>HachiAi</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion>"
        + "</Properties>"
    )


def core_xml() -> str:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return (
        xml_header()
        + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        + 'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        + 'xmlns:dcterms="http://purl.org/dc/terms/" '
        + 'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        + "<dc:title>HachiAi Management Presentation</dc:title>"
        + "<dc:creator>Codex</dc:creator>"
        + "<cp:lastModifiedBy>Codex</cp:lastModifiedBy>"
        + f'<dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>'
        + f'<dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>'
        + "</cp:coreProperties>"
    )


def presentation_xml(slide_count: int) -> str:
    slide_ids = []
    for idx in range(1, slide_count + 1):
        slide_ids.append(f'<p:sldId id="{255 + idx}" r:id="rId{idx + 1}"/>')
    return (
        xml_header()
        + '<p:presentation xmlns:a="{a}" xmlns:p="{p}" xmlns:r="{r}">'.format(**PPTX_NS)
        + '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
        + f'<p:sldIdLst>{"".join(slide_ids)}</p:sldIdLst>'
        + '<p:sldSz cx="12192000" cy="6858000"/>'
        + '<p:notesSz cx="6858000" cy="9144000"/>'
        + '<p:defaultTextStyle><a:defPPr/><a:lvl1pPr marL="0" indent="0"><a:defRPr sz="1800" b="0"><a:solidFill><a:srgbClr val="404040"/></a:solidFill></a:defRPr></a:lvl1pPr></p:defaultTextStyle>'
        + "</p:presentation>"
    )


def presentation_rels_xml(slide_count: int) -> str:
    rels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    ]
    for idx in range(1, slide_count + 1):
        rels.append(
            f'<Relationship Id="rId{idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{idx}.xml"/>'
        )
    rels.extend(
        [
            '<Relationship Id="rId20" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>',
            '<Relationship Id="rId21" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>',
            '<Relationship Id="rId22" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>',
        ]
    )
    return (
        xml_header()
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + "".join(rels)
        + "</Relationships>"
    )


def slide_master_xml() -> str:
    return (
        xml_header()
        + '<p:sldMaster xmlns:a="{a}" xmlns:p="{p}" xmlns:r="{r}">'.format(**PPTX_NS)
        + '<p:cSld name="Office Theme"><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>'
        + '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        + "</p:spTree></p:cSld>"
        + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
        + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
        + "<p:txStyles>"
        + '<p:titleStyle><a:lvl1pPr algn="l"><a:defRPr sz="2800" b="1"><a:solidFill><a:schemeClr val="dk1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:titleStyle>'
        + '<p:bodyStyle><a:lvl1pPr marL="342900" indent="-285750"><a:buFont typeface="Arial"/><a:buChar char="•"/><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle>'
        + '<p:otherStyle><a:defPPr><a:defRPr sz="1800"/></a:defPPr></p:otherStyle>'
        + "</p:txStyles>"
        + "</p:sldMaster>"
    )


def slide_master_rels_xml() -> str:
    return (
        xml_header()
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
        + "</Relationships>"
    )


def slide_layout_xml() -> str:
    return (
        xml_header()
        + '<p:sldLayout xmlns:a="{a}" xmlns:p="{p}" xmlns:r="{r}" type="blank" preserve="1">'.format(**PPTX_NS)
        + '<p:cSld name="Blank"><p:spTree>'
        + '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        + "</p:spTree></p:cSld>"
        + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'
        + "</p:sldLayout>"
    )


def slide_layout_rels_xml() -> str:
    return (
        xml_header()
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
        + "</Relationships>"
    )


def theme_xml() -> str:
    return (
        xml_header()
        + '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="HachiAi Theme">'
        + '<a:themeElements>'
        + "<a:clrScheme name=\"HachiAi Colors\">"
        + '<a:dk1><a:srgbClr val="404040"/></a:dk1>'
        + '<a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>'
        + '<a:dk2><a:srgbClr val="2D2434"/></a:dk2>'
        + '<a:lt2><a:srgbClr val="F5F3F7"/></a:lt2>'
        + f'<a:accent1><a:srgbClr val="{BRAND_PRIMARY}"/></a:accent1>'
        + f'<a:accent2><a:srgbClr val="{BRAND_ACCENT}"/></a:accent2>'
        + f'<a:accent3><a:srgbClr val="{BRAND_GOLD}"/></a:accent3>'
        + f'<a:accent4><a:srgbClr val="{SUCCESS}"/></a:accent4>'
        + f'<a:accent5><a:srgbClr val="{WARNING}"/></a:accent5>'
        + f'<a:accent6><a:srgbClr val="{DANGER}"/></a:accent6>'
        + '<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>'
        + "</a:clrScheme>"
        + '<a:fontScheme name="HachiAi Fonts">'
        + '<a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface="Aptos Display"/><a:cs typeface="Aptos Display"/></a:majorFont>'
        + '<a:minorFont><a:latin typeface="Aptos"/><a:ea typeface="Aptos"/><a:cs typeface="Aptos"/></a:minorFont>'
        + "</a:fontScheme>"
        + '<a:fmtScheme name="HachiAi Format"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
        + '<a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>'
        + '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
        + '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>'
        + "</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>"
    )


def pres_props_xml() -> str:
    return (
        xml_header()
        + '<p:presentationPr xmlns:a="{a}" xmlns:p="{p}" xmlns:r="{r}"><p:showPr useTimings="0"/></p:presentationPr>'.format(**PPTX_NS)
    )


def view_props_xml() -> str:
    return (
        xml_header()
        + '<p:viewPr xmlns:a="{a}" xmlns:p="{p}" xmlns:r="{r}" lastView="sldView"><p:normalViewPr/></p:viewPr>'.format(**PPTX_NS)
    )


def table_styles_xml() -> str:
    return (
        xml_header()
        + '<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>'
    )


def brand_header(shape_id: int, title: str, subtitle: str | None = None) -> list[ShapeSpec]:
    pieces = [
        fit_text_body(
            [paragraph_xml(title, font_size=24, color=BRAND_PRIMARY, bold=True, font_face="Aptos Display")],
            0.8,
            0.35,
            6.2,
            0.45,
            shape_id,
        ),
        line_shape(shape_id + 1, 0.8, 0.92, 11.7, LINE),
        picture_xml(shape_id + 2, "rId2", 11.55, 0.18, 1.05, 1.05, "Logo Mark"),
    ]
    if subtitle:
        pieces.append(
            fit_text_body(
                [paragraph_xml(subtitle, font_size=11, color=MUTED)],
                0.8,
                0.7,
                6.8,
                0.22,
                shape_id + 3,
            )
        )
    return pieces


def build_slides() -> list[tuple[str, list[ShapeSpec], list[tuple[str, str]]]]:
    slides: list[tuple[str, list[ShapeSpec], list[tuple[str, str]]]] = []

    s1 = [
        fit_text_body(
            [paragraph_xml("HachiAi Requirements Gathering Tool", 28, BRAND_PRIMARY, True, "Aptos Display")],
            0.8,
            0.55,
            6.5,
            0.55,
            2,
        ),
        fit_text_body([paragraph_xml("Management Overview", 16, BRAND_ACCENT, True)], 0.8, 1.18, 2.8, 0.3, 3),
        fit_text_body(
            [
                paragraph_xml("From manual note-taking to structured, same-day workflow documentation.", 28, BRAND_SECONDARY, True, "Aptos Display"),
                paragraph_xml("A desktop application designed to capture client processes, generate editable documentation, and reduce the turnaround time for requirements discovery.", 16, BRAND_SECONDARY, False, "Aptos", space_before=600, space_after=400),
            ],
            0.8,
            1.7,
            6.2,
            2.3,
            4,
        ),
        fit_text_body(
            [paragraph_xml("Built by:", 14, MUTED, True), paragraph_xml("Qamar / HachiAi internal tooling initiative", 16, BRAND_SECONDARY, True)],
            0.8,
            5.55,
            4.2,
            0.65,
            5,
            fill=WHITE,
            line=LINE,
            radius="roundRect",
        ),
        fit_text_body(
            [paragraph_xml("Windows installer and portable build are ready for stakeholder review.", 14, WHITE, True)],
            0.8,
            6.45,
            6.6,
            0.42,
            6,
            fill=BRAND_PRIMARY,
            radius="roundRect",
        ),
        fit_text_body(
            [
                paragraph_xml("Why this matters", 16, BRAND_PRIMARY, True),
                paragraph_xml("Requirements sessions can now be recorded once and turned into reusable, visual process documentation instead of relying on handwritten notes, screenshots, and repeated follow-ups.", 14, BRAND_SECONDARY),
            ],
            7.35,
            1.95,
            4.55,
            1.95,
            7,
            fill=WHITE,
            line=LINE,
            radius="roundRect",
        ),
        fit_text_body(
            [paragraph_xml("70-85%", 28, WHITE, True, "Aptos Display"), paragraph_xml("potential reduction in documentation effort", 13, WHITE)],
            7.45,
            4.25,
            2.0,
            1.55,
            8,
            fill=BRAND_ACCENT,
            radius="roundRect",
        ),
        fit_text_body(
            [paragraph_xml("Same day", 28, WHITE, True, "Aptos Display"), paragraph_xml("draft guide generation after capture", 13, WHITE)],
            9.7,
            4.25,
            2.0,
            1.55,
            9,
            fill=BRAND_SECONDARY,
            radius="roundRect",
        ),
        picture_xml(10, "rId3", 8.3, 0.7, 3.1, 0.9, "Primary Logo"),
    ]
    slides.append(("Overview", s1, [("rId2", "logo-mark.png"), ("rId3", "logo.png")]))

    s2 = brand_header(2, "The Problem We Had To Solve", "The old process was accurate, but slow and heavily dependent on manual effort.")
    s2.extend(
        [
            fit_text_body(
                [
                    paragraph_xml("Before HachiAi", 20, BRAND_SECONDARY, True),
                    paragraph_xml("Analysts sat through client walkthroughs while taking notes manually.", 15, BRAND_SECONDARY, False, bullet=True),
                    paragraph_xml("Screenshots had to be captured, sorted, renamed, and inserted one by one.", 15, BRAND_SECONDARY, False, bullet=True),
                    paragraph_xml("Clarifications were often needed later because details were missed during live sessions.", 15, BRAND_SECONDARY, False, bullet=True),
                    paragraph_xml("Final deliverables depended on individual documentation style and effort.", 15, BRAND_SECONDARY, False, bullet=True),
                ],
                0.85,
                1.35,
                7.1,
                4.7,
                6,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            ),
            fit_text_body(
                [paragraph_xml("Typical baseline", 17, BRAND_PRIMARY, True), paragraph_xml("2 to 3 hours", 26, BRAND_PRIMARY, True, "Aptos Display"), paragraph_xml("to convert a single session into a clean requirements document", 13, MUTED)],
                8.3,
                1.5,
                3.0,
                1.45,
                7,
                fill=BRAND_LIGHT,
                radius="roundRect",
            ),
            fit_text_body(
                [paragraph_xml("Common pain point", 17, BRAND_PRIMARY, True), paragraph_xml("Multiple follow-ups", 22, BRAND_SECONDARY, True), paragraph_xml("because process steps, dependencies, and edge cases were not always captured live", 13, MUTED)],
                8.3,
                3.15,
                3.0,
                1.45,
                8,
                fill=BRAND_LIGHT,
                radius="roundRect",
            ),
            fit_text_body(
                [paragraph_xml("Delivery impact", 17, BRAND_PRIMARY, True), paragraph_xml("3 to 5 days", 26, WARNING, True, "Aptos Display"), paragraph_xml("from first walkthrough to polished client-ready guide in busy periods", 13, MUTED)],
                8.3,
                4.8,
                3.0,
                1.45,
                9,
                fill=BRAND_LIGHT,
                radius="roundRect",
            ),
            fit_text_body([paragraph_xml("All numbers are editable placeholders based on a standard workflow-analysis cycle.", 10, MUTED)], 0.95, 6.55, 6.7, 0.2, 10),
        ]
    )
    slides.append(("Problem", s2, [("rId2", "logo-mark.png")]))

    s3 = brand_header(2, "Before vs After", "A simple story for management: less manual work, more consistency, faster turnaround.")
    s3.extend(
        [
            fit_text_body([paragraph_xml("Before", 20, WHITE, True, "Aptos Display")], 0.9, 1.45, 2.4, 0.5, 6, fill=BRAND_SECONDARY, radius="roundRect"),
            fit_text_body([paragraph_xml("After", 20, WHITE, True, "Aptos Display")], 6.95, 1.45, 2.4, 0.5, 7, fill=BRAND_PRIMARY, radius="roundRect"),
            fit_text_body(
                [
                    paragraph_xml("Live client walkthrough", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Manual notes + screenshots", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Post-session rewrite", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Follow-up clarifications", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Final document assembly", 16, BRAND_SECONDARY, True),
                ],
                0.9,
                2.1,
                4.6,
                3.65,
                8,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            ),
            fit_text_body(
                [
                    paragraph_xml("Single guided capture session", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Automatic step logging", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Screenshots linked to actions", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Editable structured guide", 16, BRAND_SECONDARY, True),
                    paragraph_xml("Fast export and review", 16, BRAND_SECONDARY, True),
                ],
                6.95,
                2.1,
                4.0,
                3.65,
                9,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            ),
            fit_text_body([paragraph_xml("4.5 hrs", 20, WHITE, True), paragraph_xml("traditional effort", 11, WHITE)], 4.2, 2.28, 1.2, 0.75, 10, fill=WARNING, radius="roundRect"),
            fit_text_body([paragraph_xml("0.75 hrs", 20, WHITE, True), paragraph_xml("with the tool", 11, WHITE)], 10.0, 2.28, 1.2, 0.75, 11, fill=SUCCESS, radius="roundRect"),
            fit_text_body(
                [paragraph_xml("Estimated efficiency gain", 18, BRAND_PRIMARY, True), paragraph_xml("3.75 hours saved per workflow", 26, BRAND_PRIMARY, True, "Aptos Display"), paragraph_xml("Equivalent to ~83% less analyst effort for documentation-heavy engagements", 13, MUTED)],
                3.3,
                5.95,
                5.65,
                0.8,
                12,
                fill=BRAND_LIGHT,
                radius="roundRect",
            ),
        ]
    )
    slides.append(("Comparison", s3, [("rId2", "logo-mark.png")]))

    s4 = brand_header(2, "How The Tool Works", "The workflow is simple enough for delivery teams and structured enough for repeatable output.")
    step_positions = [0.9, 3.15, 5.4, 7.65, 9.9]
    step_titles = ["Capture", "Recognize", "Review", "Annotate", "Export"]
    step_desc = [
        "Record the client workflow once across web and desktop apps.",
        "Group clicks, keys, and context into meaningful steps.",
        "Let the analyst refine wording instead of building from scratch.",
        "Highlight or redact sensitive areas in screenshots.",
        "Share polished HTML or PDF guides quickly.",
    ]
    for idx, (x, title, desc) in enumerate(zip(step_positions, step_titles, step_desc), start=6):
        s4.append(
            fit_text_body(
                [
                    paragraph_xml(f"{idx - 5:02d}", 24, WHITE, True, "Aptos Display", align="ctr"),
                    paragraph_xml(title, 18, BRAND_SECONDARY, True, align="ctr"),
                    paragraph_xml(desc, 12, MUTED, False, align="ctr"),
                ],
                x,
                2.2,
                1.85,
                2.75,
                idx,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            )
        )
    s4.extend(
        [
            line_shape(20, 2.45, 3.55, 0.7, BRAND_ACCENT, 25400),
            line_shape(21, 4.7, 3.55, 0.7, BRAND_ACCENT, 25400),
            line_shape(22, 6.95, 3.55, 0.7, BRAND_ACCENT, 25400),
            line_shape(23, 9.2, 3.55, 0.7, BRAND_ACCENT, 25400),
            fit_text_body(
                [paragraph_xml("Result: a cleaner requirements process with fewer missed details and a much faster path to documentation.", 18, WHITE, True, align="ctr")],
                1.35,
                5.55,
                10.6,
                0.7,
                24,
                fill=BRAND_PRIMARY,
                radius="roundRect",
            ),
        ]
    )
    slides.append(("Workflow", s4, [("rId2", "logo-mark.png")]))

    s5 = brand_header(2, "Capability Highlights", "What makes this more than a screen recorder.")
    features = [
        ("System-wide capture", "Tracks activity across desktop apps and browser workflows."),
        ("Smart step generation", "Turns raw events into readable actions and grouped process steps."),
        ("Interactive editor", "Users can reorder, rewrite, and improve the guide before delivery."),
        ("Annotation tools", "Highlight key areas or hide sensitive content directly on screenshots."),
        ("Local-first storage", "Recordings and screenshots remain on the device for stronger privacy."),
        ("Professional export", "Generates client-ready documentation that looks polished from day one."),
    ]
    feature_boxes = [(0.9, 1.75), (4.35, 1.75), (7.8, 1.75), (0.9, 4.1), (4.35, 4.1), (7.8, 4.1)]
    for idx, ((x, y), (title, desc)) in enumerate(zip(feature_boxes, features), start=6):
        s5.append(
            fit_text_body(
                [paragraph_xml(title, 17, BRAND_PRIMARY, True), paragraph_xml(desc, 13, BRAND_SECONDARY)],
                x,
                y,
                3.0,
                1.75,
                idx,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            )
        )
    slides.append(("Capabilities", s5, [("rId2", "logo-mark.png")]))

    s6 = brand_header(2, "Business Impact", "This slide is designed for management discussion and can be edited directly in PowerPoint.")
    s6.extend(
        [
            fit_text_body([paragraph_xml("If the team documents 10 workflows per month:", 19, BRAND_SECONDARY, True)], 0.9, 1.4, 5.6, 0.45, 6),
            fit_text_body([paragraph_xml("~37.5 hours", 26, WHITE, True, "Aptos Display", align="ctr"), paragraph_xml("monthly analyst time saved", 12, WHITE, align="ctr")], 0.95, 2.05, 2.5, 1.35, 7, fill=BRAND_PRIMARY, radius="roundRect"),
            fit_text_body([paragraph_xml("Faster client turnaround", 18, WHITE, True, align="ctr"), paragraph_xml("same-day draft documentation instead of multi-day follow-up", 12, WHITE, align="ctr")], 3.65, 2.05, 2.7, 1.35, 8, fill=BRAND_ACCENT, radius="roundRect"),
            fit_text_body([paragraph_xml("Higher consistency", 18, WHITE, True, align="ctr"), paragraph_xml("repeatable output quality across analysts and engagements", 12, WHITE, align="ctr")], 6.55, 2.05, 2.7, 1.35, 9, fill=SUCCESS, radius="roundRect"),
            fit_text_body([paragraph_xml("Lower rework", 18, WHITE, True, align="ctr"), paragraph_xml("fewer missed steps and fewer clarification loops", 12, WHITE, align="ctr")], 9.45, 2.05, 2.0, 1.35, 10, fill=BRAND_SECONDARY, radius="roundRect"),
            fit_text_body(
                [
                    paragraph_xml("Strategic value", 18, BRAND_PRIMARY, True),
                    paragraph_xml("This is not just an internal productivity app. It creates a scalable capture-to-documentation capability that can support implementations, SOP creation, audits, onboarding, and client handover packs.", 14, BRAND_SECONDARY),
                ],
                0.9,
                4.15,
                5.75,
                1.65,
                11,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            ),
            fit_text_body(
                [
                    paragraph_xml("Management takeaway", 18, BRAND_PRIMARY, True),
                    paragraph_xml("A relatively small internal build can remove a large amount of repetitive delivery effort while improving output quality.", 14, BRAND_SECONDARY),
                    paragraph_xml("The assumptions on this slide can be edited to match actual utilization or billing data.", 11, MUTED),
                ],
                6.95,
                4.15,
                4.2,
                1.65,
                12,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            ),
        ]
    )
    slides.append(("Impact", s6, [("rId2", "logo-mark.png")]))

    s7 = brand_header(2, "Current Build Status", "Delivery readiness as of March 30, 2026.")
    s7.extend(
        [
            fit_text_body(
                [
                    paragraph_xml("Completed", 18, WHITE, True, align="ctr"),
                    paragraph_xml("Windows installer build", 17, WHITE, True, align="ctr"),
                    paragraph_xml("HachiAi Requirements Gathering Tool-1.0.0-Setup.exe", 11, WHITE, align="ctr"),
                ],
                0.9,
                1.7,
                3.35,
                1.55,
                6,
                fill=BRAND_PRIMARY,
                radius="roundRect",
            ),
            fit_text_body(
                [
                    paragraph_xml("Completed", 18, WHITE, True, align="ctr"),
                    paragraph_xml("Portable Windows package", 17, WHITE, True, align="ctr"),
                    paragraph_xml("zip package and unpacked folder ready", 11, WHITE, align="ctr"),
                ],
                4.55,
                1.7,
                3.35,
                1.55,
                7,
                fill=BRAND_ACCENT,
                radius="roundRect",
            ),
            fit_text_body(
                [
                    paragraph_xml("Prepared", 18, WHITE, True, align="ctr"),
                    paragraph_xml("macOS build handoff", 17, WHITE, True, align="ctr"),
                    paragraph_xml("documentation ready for execution on a real Mac", 11, WHITE, align="ctr"),
                ],
                8.2,
                1.7,
                3.35,
                1.55,
                8,
                fill=BRAND_SECONDARY,
                radius="roundRect",
            ),
            fit_text_body(
                [
                    paragraph_xml("Next recommended steps", 18, BRAND_PRIMARY, True),
                    paragraph_xml("Pilot the tool with one or two active client discovery engagements.", 14, BRAND_SECONDARY, bullet=True),
                    paragraph_xml("Capture measured baseline vs actual time saved over the next 2 to 4 weeks.", 14, BRAND_SECONDARY, bullet=True),
                    paragraph_xml("Use the data to support broader rollout and code-signing investment.", 14, BRAND_SECONDARY, bullet=True),
                ],
                0.9,
                3.8,
                5.8,
                2.0,
                9,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            ),
            fit_text_body(
                [
                    paragraph_xml("Key message for management", 18, BRAND_PRIMARY, True),
                    paragraph_xml("The product is already in a reviewable state. The next milestone is proving adoption and quantified value through a short pilot window.", 14, BRAND_SECONDARY),
                ],
                7.0,
                3.8,
                4.2,
                2.0,
                10,
                fill=WHITE,
                line=LINE,
                radius="roundRect",
            ),
        ]
    )
    slides.append(("Status", s7, [("rId2", "logo-mark.png")]))

    s8 = [
        picture_xml(2, "rId2", 0.95, 0.55, 3.2, 0.92, "Primary Logo"),
        fit_text_body(
            [paragraph_xml("Thank You", 30, BRAND_PRIMARY, True, "Aptos Display"), paragraph_xml("Built to make requirements gathering faster, clearer, and more scalable.", 18, BRAND_SECONDARY)],
            0.95,
            1.8,
            6.0,
            1.4,
            3,
        ),
        fit_text_body(
            [
                paragraph_xml("Management discussion points", 18, BRAND_PRIMARY, True),
                paragraph_xml("Approve a short pilot with live client-facing analysts.", 15, BRAND_SECONDARY, bullet=True),
                paragraph_xml("Track actual cycle-time reduction and documentation quality improvements.", 15, BRAND_SECONDARY, bullet=True),
                paragraph_xml("Decide whether to formalize this as a wider HachiAi capability.", 15, BRAND_SECONDARY, bullet=True),
            ],
            0.95,
            3.2,
            6.0,
            2.25,
            4,
            fill=WHITE,
            line=LINE,
            radius="roundRect",
        ),
        fit_text_body(
            [paragraph_xml("Editable deck", 18, WHITE, True, align="ctr"), paragraph_xml("All text, numbers, and layout blocks can be edited directly in PowerPoint.", 14, WHITE, align="ctr")],
            1.15,
            5.95,
            5.6,
            0.85,
            5,
            fill=BRAND_PRIMARY,
            radius="roundRect",
        ),
        fit_text_body(
            [
                paragraph_xml("Suggested closing line", 18, BRAND_PRIMARY, True),
                paragraph_xml("We built a practical internal product that turns a slow, manual requirements activity into a repeatable and scalable documentation workflow.", 16, BRAND_SECONDARY),
            ],
            7.2,
            1.45,
            4.05,
            2.0,
            6,
            fill=WHITE,
            line=LINE,
            radius="roundRect",
        ),
        picture_xml(7, "rId3", 7.65, 4.0, 3.2, 3.2, "Logo Mark Large"),
    ]
    slides.append(("Close", s8, [("rId2", "logo.png"), ("rId3", "logo-mark.png")]))

    return slides


def write_pptx(output_path: Path) -> None:
    slides = build_slides()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml(len(slides)))
        zf.writestr("_rels/.rels", root_rels_xml())
        zf.writestr("docProps/app.xml", app_xml(len(slides)))
        zf.writestr("docProps/core.xml", core_xml())
        zf.writestr("ppt/presentation.xml", presentation_xml(len(slides)))
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels_xml(len(slides)))
        zf.writestr("ppt/presProps.xml", pres_props_xml())
        zf.writestr("ppt/viewProps.xml", view_props_xml())
        zf.writestr("ppt/tableStyles.xml", table_styles_xml())
        zf.writestr("ppt/slideMasters/slideMaster1.xml", slide_master_xml())
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", slide_master_rels_xml())
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", slide_layout_xml())
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slide_layout_rels_xml())
        zf.writestr("ppt/theme/theme1.xml", theme_xml())

        zf.write(LOGO_PATH, "ppt/media/logo.png")
        zf.write(LOGO_MARK_PATH, "ppt/media/logo-mark.png")

        for idx, (_, shapes, image_rels) in enumerate(slides, start=1):
            zf.writestr(f"ppt/slides/slide{idx}.xml", slide_xml(shapes))
            zf.writestr(f"ppt/slides/_rels/slide{idx}.xml.rels", slide_rels_xml(image_rels))


def main() -> None:
    if not LOGO_PATH.exists():
        raise FileNotFoundError(f"Missing logo asset: {LOGO_PATH}")
    if not LOGO_MARK_PATH.exists():
        raise FileNotFoundError(f"Missing logo asset: {LOGO_MARK_PATH}")

    write_pptx(OUTPUT_PATH)
    print(f"Created editable PowerPoint at: {OUTPUT_PATH.resolve()}")


if __name__ == "__main__":
    main()
