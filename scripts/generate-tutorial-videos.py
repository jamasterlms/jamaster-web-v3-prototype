#!/usr/bin/env python3
"""Reproduce Turkish text tutorial videos; requires Pillow and ffmpeg/ffprobe."""
import json, subprocess, concurrent.futures, argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True, help='Temporary output directory; copy MP4/WebP/VTT to public/tutorials after review')
ROOT = parser.parse_args().output.resolve()
ROOT.mkdir(parents=True, exist_ok=True)
SOURCE = PROJECT / 'src/features/help/tutorials.json'
BG='#f8f7f5'; PLUM='#58505f'; INK='#332e38'; MUTED='#746d7a'; YELLOW='#f5d772'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(n,bold=False): return ImageFont.truetype(BOLD if bold else FONT,n)
def wrap(draw,text,f,width):
    lines=[]; line=''
    for word in text.split():
        candidate=(line+' '+word).strip()
        if draw.textlength(candidate,font=f)>width and line:
            lines.append(line); line=word
        else: line=candidate
    return lines+[line]
def block(d,text,xy,width,size,color,bold=False,maxheight=None):
    while True:
        f=font(size,bold); lines=wrap(d,text,f,width); spacing=int(size*1.42)
        if maxheight is None or len(lines)*spacing<=maxheight: break
        size-=1
        assert size>=24,(text,'cannot fit')
    x,y=xy
    for line in lines:
        assert d.textlength(line,font=f)<=width
        d.text((x,y),line,font=f,fill=color)
        y+=spacing
    return y
def frame(entry,idx):
    im=Image.new('RGB',(1280,720),BG); d=ImageDraw.Draw(im)
    d.rounded_rectangle((48,38,91,81),12,fill=PLUM)
    d.text((61,40),'j',font=font(30,True),fill=YELLOW)
    d.text((105,44),'jamaster',font=font(25,True),fill=PLUM)
    d.text((105,77),'YARDIM MERKEZİ',font=font(12,True),fill=MUTED)
    cat=entry['category'].upper(); cw=d.textlength(cat,font=font(16,True))
    d.rounded_rectangle((1228-cw-36,44,1232,84),20,fill='#eeebef')
    d.text((1214-cw,52),cat,font=font(16,True),fill=PLUM)
    block(d,entry['title'],(64,125),1152,35,INK,True,maxheight=102)
    d.rounded_rectangle((64,232,1216,593),24,fill='white',outline='#e9e5eb',width=2)
    d.rounded_rectangle((91,261,161,331),20,fill=YELLOW)
    d.text((112,271),str(idx+1),font=font(34,True),fill=PLUM)
    step=entry['steps'][idx]
    block(d,step['title'],(187,270),979,30,PLUM,True,maxheight=88)
    block(d,step['text'],(97,366),1080,30,INK,maxheight=184)
    for n in range(3):
        x=64+n*390
        d.rounded_rectangle((x,621,x+372,629),4,fill=YELLOW if n==idx else '#e5e1e7')
    d.text((64,649),f'ADIM {idx+1} / 3',font=font(16,True),fill=PLUM)
    d.text((800,649),'Metinli rehber  •  İstediğiniz an duraklatın',font=font(16),fill=MUTED)
    return im
def run(entry):
    tid=entry['id']; frames=ROOT/'frames'/tid; frames.mkdir(parents=True,exist_ok=True)
    for i in range(3):
        im=frame(entry,i); im.save(frames/f'{i}.png')
        if i==0: im.save(ROOT/f'{tid}.webp',quality=88,method=6)
    manifest=frames/'concat.txt'
    manifest.write_text(''.join(f"file '{i}.png'\nduration 8\n" for i in range(3))+"file '2.png'\n")
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(manifest),'-t','24','-vf','fps=10','-c:v','libx264','-preset','veryfast','-crf','23','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/f'{tid}.mp4')],check=True)
    captions=['WEBVTT','']
    for i,step in enumerate(entry['steps']):
        captions.extend([str(i+1),f'00:00:{i*8:02d}.000 --> 00:00:{(i+1)*8:02d}.000',step['title']+'.',step['text'],''])
    (ROOT/f'{tid}.vtt').write_text('\n'.join(captions),encoding='utf-8')
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,pix_fmt:format=duration,size','-of','json',str(ROOT/f'{tid}.mp4')]))
    stream=probe['streams'][0]
    assert stream['width']==1280 and stream['height']==720 and stream['pix_fmt']=='yuv420p'
    assert abs(float(probe['format']['duration'])-24)<.01
    print(tid,probe['format']['size'],flush=True)
    return {'id':tid,**probe}
if __name__=='__main__':
    catalog_path=ROOT/'catalog.json'
    if SOURCE.exists(): catalog_path.write_bytes(SOURCE.read_bytes())
    catalog=json.loads(catalog_path.read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(run,catalog))
    (ROOT/'validation.json').write_text(json.dumps(results,indent=2))
    print('VALIDATED',len(results),'videos')
