Put the woodcuts and engravings here (black ink on white or transparent paper;
PNG, JPG or WebP, any size). Then run `node scripts/make-engravings.mjs`: it
writes small greyscale copies to public/engravings/, and the page lays each over
the background of a section, as a faint tilted outline half off the edge.
Each new file takes the next free place; see components/Engravings.tsx.
