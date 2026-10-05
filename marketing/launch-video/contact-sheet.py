# Tiles QC stills into one image: python contact-sheet.py out/sheet.png 0.5 1.6 ...
import subprocess, sys, os, imageio_ffmpeg
here = os.path.dirname(os.path.abspath(__file__))
out, times = sys.argv[1], sys.argv[2:]
lst = os.path.join(here, 'out', 'concat.txt')
with open(lst, 'w') as f:
    for t in times:
        f.write(f"file '{os.path.join(here, 'out', 'stills', 't%05.2f.png' % float(t))}'\nduration 1\n")
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
  '-vf', 'scale=640:-1,tile=4x4:padding=6:color=0x333333', '-frames:v', '1', out], check=True)
