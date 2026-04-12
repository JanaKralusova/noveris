import { Font } from "@react-pdf/renderer";

import NewsreaderRegular from "@/assets/fonts/Newsreader-Regular.ttf";
import NewsreaderItalic from "@/assets/fonts/Newsreader-Italic.ttf";
import NewsreaderBold from "@/assets/fonts/Newsreader-Bold.ttf";
import ManropeRegular from "@/assets/fonts/Manrope-Regular.ttf";
import ManropeMedium from "@/assets/fonts/Manrope-Medium.ttf";
import ManropeBold from "@/assets/fonts/Manrope-Bold.ttf";

Font.register({
  family: "Newsreader",
  fonts: [
    { src: NewsreaderRegular, fontWeight: 400, fontStyle: "normal" },
    { src: NewsreaderItalic, fontWeight: 400, fontStyle: "italic" },
    { src: NewsreaderBold, fontWeight: 700, fontStyle: "normal" },
  ],
});

Font.register({
  family: "Manrope",
  fonts: [
    { src: ManropeRegular, fontWeight: 400, fontStyle: "normal" },
    { src: ManropeMedium, fontWeight: 500, fontStyle: "normal" },
    { src: ManropeBold, fontWeight: 700, fontStyle: "normal" },
  ],
});
