# Photo credits

Self-hosted photos for the service pages, served from `/assets/photos/services/<name>{-400,-560,-800,-1200,-1600,}.{jpg,avif}` (the unsuffixed file is 2000 px wide).
Most photos are published under the Unsplash License or the Pexels License (both free for commercial use, no attribution required; credited here anyway); the rest are own images supplied by the client (Mgr. Jana Králusová), some of them colour-edited versions of Unsplash/Pexels photos.
Produced with `scripts/make-photo.sh` from the Unsplash originals downloaded at 2400 px wide (`https://unsplash.com/photos/<id>/download`, then `?w=2400`; the id is the part of the URL after the last `-` of the slug, 11 characters) or, for Pexels photos, from `https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?w=2400` on images.pexels.com, so every file is a first-generation resize of a large original. A test checks that every name below exists in all widths and both formats and stays within its size budget.

Photos are centre-cropped to at most 4:3 (make-photo.sh); `CROP="x y w h"` cuts a fixed rectangle of the source first when a photo needs a set framing.

| Name | Author | Unsplash URL | Licence |
|---|---|---|---|
| agri | Vivek | https://unsplash.com/photos/wDiAwelelzE | Unsplash License |
| articles_desk | AI-generated image supplied by Noveris Legal (own image) | – | Own image |
| atrium_plants | – | https://unsplash.com/photos/m0B-uK0GNAM | Unsplash License |
| band1 | Amber Kipp | https://unsplash.com/photos/Wg380n-aD7Q | Unsplash License |
| band2 | Clay Banks | https://unsplash.com/photos/CjmHORCoIfw | Unsplash License |
| band3 | @seelean | https://unsplash.com/photos/ufNDnFKEKQE | Unsplash License |
| band4 | Clay Banks | https://unsplash.com/photos/b6Bs19onFtY | Unsplash License |
| bld | Tobias Wilden | https://unsplash.com/photos/apartment-building-reflecting-pink-sky-4453DIQWtsQ | Unsplash License |
| bratislava_castle | AI-generated image supplied by Noveris Legal (own image) | – | Own image |
| bratislava_square | – | https://www.pexels.com/photo/16438456/ | Pexels License |
| business_park_aerial | – | https://unsplash.com/photos/N9pLLb_M8DQ | Unsplash License (mirrored) |
| chairs | Michael Fousert | https://unsplash.com/photos/office-chairs-at-conference-table-RNsKphkdBTk | Unsplash License |
| chim | Alexandr Popadin | https://unsplash.com/photos/-SC9r6ix6vM | Unsplash License |
| clipped_documents | – | https://www.pexels.com/photo/6693647/ | Pexels License |
| contract_paper | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| contract_table | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| couple_sofa | – | https://www.pexels.com/photo/8559951/ | Pexels License |
| cracked_wall | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| crane | Matias Santana | https://unsplash.com/photos/gray-building-crane-photo-during-sunset-2ykXqiKHNfk | Unsplash License |
| euro_desk | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| family_meeting | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| farm1 | Damian Kravchuk | https://unsplash.com/photos/p7u7E1YJiB8 | Unsplash License |
| fence_gate | – | https://www.pexels.com/photo/14306688/ | Pexels License |
| folders | Beatriz Perez Moya | https://unsplash.com/photos/a-stack-of-thick-folders-on-a-white-surface-XN4T2PVUUgk | Unsplash License |
| garden_coffee | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| gavel | Sasun Bughdaryan | https://unsplash.com/photos/a-wooden-gavel-rests-on-a-closed-book-NB1dUts3ROU | Unsplash License |
| glass_corner_warm | Mgr. Jana Králusová (edited and recropped) | https://www.pexels.com/photo/low-angle-photo-of-glass-buildings-2599538/ | Pexels License |
| glassbld | Joakim Honkasalo | https://unsplash.com/photos/glass-office-building-at-dusk-gKMxcHB3U3E | Unsplash License |
| gov | Yang-Chen Lin | https://unsplash.com/photos/Gy2_7oTYbhU | Unsplash License |
| hero_eu | Jonathan Arbely | https://unsplash.com/photos/2gs-IfX4DnM | Unsplash License |
| home_villa_warm | AI-generated image supplied by Noveris Legal (own image) | – | Own image |
| horse | Jacob Jolibois | https://unsplash.com/photos/_CZYN3UN544 | Unsplash License |
| interior | Julia (@beazy) | https://unsplash.com/photos/aX1TTOuq83M | Unsplash License |
| justice2 | Adrien Delforge | https://unsplash.com/photos/0LUqdizULdY | Unsplash License |
| justice_dark | Sasun Bughdaryan | https://unsplash.com/photos/statue-of-justice-with-scales-on-dark-background-KRNCAqkk8TE | Unsplash License |
| laptop_notebook | – | https://www.pexels.com/photo/5554650/ | Pexels License |
| lawyer_meeting | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| logistics_aerial | – | https://www.pexels.com/photo/2804929/ | Pexels License |
| man_letter | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| manor_aerial_warm | Mgr. Jana Králusová (colour-edited) | https://unsplash.com/photos/zAzaEsB9ZL4 | Unsplash License |
| meeting_sil | Marco Bianchetti | https://unsplash.com/photos/a-group-of-people-sitting-at-a-table-in-front-of-a-window-JLS3I_cYx-k | Unsplash License |
| meeting_view | – | https://unsplash.com/photos/ov_ctAopIoI | Unsplash License |
| off | Linus Belanger | https://unsplash.com/photos/z-XlxM2vAPY | Unsplash License |
| office_boxes | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| owners_tree | AI-generated image supplied by Noveris Legal (own image) | – | Own image |
| paperstack | ron dyar | https://unsplash.com/photos/stack-of-papers-V29UWcALNko | Unsplash License |
| patchwork_aerial | – | https://www.pexels.com/photo/8322786/ | Pexels License |
| pensign | Signature Pro | https://unsplash.com/photos/person-writing-on-white-paper-wB9iWZKwljw | Unsplash License |
| plan1 | Marina Zvada | https://unsplash.com/photos/fNxmdlYHRm8 | Unsplash License |
| planmodel | Declan Sun | https://unsplash.com/photos/architectural-model-with-blueprints-on-wall-1hEhb26Bn20 | Unsplash License |
| privacy_desk | AI-generated image supplied by Noveris Legal (own image) | – | Own image |
| prod | Mathias Reding | https://unsplash.com/photos/J-MU2AJNKiI | Unsplash License |
| s_court | Titus Seawright | https://unsplash.com/photos/-iWupXHt9No | Unsplash License |
| services_desk | AI-generated image supplied by Noveris Legal (own image) | – | Own image |
| sign4 | Shutter Speed | https://unsplash.com/photos/hand-writing-with-a-fountain-pen-on-paper-rz_0EzMAmis | Unsplash License |
| skyline | Kun Liu | https://unsplash.com/photos/modern-cityscape-with-tall-buildings-at-sunset-T7VKv5DUH5w | Unsplash License |
| stone_farmhouse | – | https://www.pexels.com/photo/18414268/ | Pexels License |
| sunfield | Erik van Dijk | https://unsplash.com/photos/green-grass-field-with-trees-during-daytime-fhItZw4xYhI | Unsplash License |
| table2 | Amina Atar | https://unsplash.com/photos/two-men-sitting-at-a-table-with-papers-and-a-pen-Mqc-m8kgxkg | Unsplash License |
| timber_facade | – | https://unsplash.com/photos/rn7TtBdzkBk | Unsplash License |
| tree_lane | – | https://www.pexels.com/photo/33301797/ | Pexels License |
| villa_view_money | Mgr. Jana Králusová | own image, supplied 2026-11-09 | own image |
| ware | Bernd Dittrich | https://unsplash.com/photos/iDSXatl7yNo | Unsplash License |

Notes:
- `bratislava_castle` (castle, old town, Danube) is the contact hero.
- `interior`, `justice2` replace the prototype photos (3D render, street with a German road sign, greyscale Lady Justice).
- `band1` to `band4` are the closing contact-band photos; they replace the repeated `plant` and are rotated between pages.
