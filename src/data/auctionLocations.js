// Raw data from your request
const rawIaaData = `
TX - Abilene - 7700 U.S. Hwy. 277 S., Abilene, TX 79601
CA - ACE - Carson - 16920 S. Figueroa St., Gardena, CA 90248
CA - ACE - Perris - 495 Harley Knox Blvd., Perris, CA 92571
CA - ACE - Perris 2 - 775 Harley Knox Blvd., Perris, CA 92571
OH - Akron-Canton - 2932 State Route 259 S.E., New Philadelphia, OH 44663
NY - Albany - 1210 Kings Rd., Schenectady, NY 12303
NM - Albuquerque - 4400 Broadway Blvd. S.E., Albuquerque, NM 87105
PA - Altoona - 15369 Dunnings Hwy., East Freedom, PA 16637
TX - Amarillo - 11150 S. FM 1541, Amarillo, TX 79118
CA - Anaheim - 2961 E. La Jolla St., Anaheim, CA 92806
CA - Anaheim Consolidated - 2961 E. La Jolla St., Anaheim, CA 92806
AK - Anchorage - 1446 W. Mystery Ave., Wasilla, AK 99654
WI - Appleton - 2591 S. Casaloma Dr., Appleton, WI 54914
NC - Asheville - 4900 Hendersonville Rd., Fletcher, NC 28732
KY - Ashland - 123 Four Wheel Dr., Ashland, KY 41102
GA - Atlanta - 125 Old Highway 138, Loganville, GA 30052
GA - Atlanta East - 1045 Atlanta Hwy. S.E., Winder, GA 30680
GA - Atlanta North - 6242 BlackAcre Trl. N.W., Acworth, GA 30101
GA - Atlanta South - 1930 Rex Rd., Lake City, GA 30260
TX - Austin - 2191 Highway 21 West, Dale, TX 78616
TX - Austin North - 23010 Firefly Rd, Florence, TX 76527
NJ - Avenel New Jersey - 87 Randolph Ave., Avenel, NJ 07001
MD - Baltimore - 3131 Hawkins Point Rd., Baltimore, MD 21226
LA - Baton Rouge - 5978 Highway 75, Carville, LA 70721
MT - Billings - 75 Cerise Rd., Billings, MT 59101
AL - Birmingham - 1600 Highway 150, Bessemer, AL 35022
ID - Boise - 1881 W. Marcon Ln., Meridian, ID 83642
MA - Boston - Shirley - 2 Going Rd., Shirley, MA 01464
KY - Bowling Green - 710 Woodford Ave., Bowling Green, KY 42101
PA - Bridgeport - 396 E. Schuylkill River Rd., Bridgeport, PA 19405
WV - Buckhannon - 200 Auction Ln., Buckhannon, WV 26201
NY - Buffalo - 366 Vulcan St., Buffalo, NY 14207
VT - Burlington - 304 Colchester Rd., Essex Junction, VT 05451
WY - Casper - 2305 Salt Creek Hwy., Casper, WY 82601
NJ - Central New Jersey - 426 Texas Rd., Morganville, NJ 07751
SC - Charleston - 430 Tannenbaum Rd., Ravenel, SC 29470
NC - Charlotte - 1710 Starita Rd., Charlotte, NC 28206
TN - Chattanooga - 2801 Asbury Park St., Chattanooga, TN 37404
IL - Chicago-North - 605 Healy Rd., East Dundee, IL 60118
IL - Chicago-South - 16425 Crawford Ave., Markham, IL 60428
IL - Chicago-West - 280 E. Sullivan Rd., Aurora, IL 60505
OH - Cincinnati - 10100 Windisch Rd., West Chester, OH 45069
OH - Cincinnati-South - 1736 Lindale Mount Holly Rd., Amelia, OH 45102
FL - Clearwater - 5152 126 Ave. N., Clearwater, FL 33760
OH - Cleveland - 7437 Deer Trail Ln., Lorain, OH 44053
CO - Colorado Springs - 8500 Import Ct., Colorado Springs, CO 80925
OH - Columbus - 1601 Thrailkill Road, Grove City, OH 43123
NC - Concord - 5100 Merle Rd., Concord, NC 28025
TX - Corpus Christi - 4701 Agnes St., Corpus Christi, TX 78405
VA - Culpeper - 15201 Review Rd., Culpeper, VA 22701
TX - Dallas - 204 Mars Rd., Wilmer, TX 75172
TX - Dallas/Ft Worth - 4226 E. Main St., Grand Prairie, TX 75050
IA - Davenport - 5403 Rockingham Rd., Davenport, IA 52802
OH - Dayton - 400 Cherokee Dr., Dayton, OH 45417
CO - Denver East - 8510 Brighton Rd., Commerce City, CO 80022
IA - Des Moines - 1000 Armstrong Dr., De Soto, IA 50069
MI - Detroit - 8251 Rawsonville Rd., Belleville, MI 48111
AL - Dothan - 15994 U.S. Highway 431 N., Headland, AL 36345
IL - Dream Rides - Two Westbrook Corporate Center, Westchester, IL 60154
MD - Dundalk - 8143 Beachwood Rd., Dundalk, MD 21222
CA - East Bay - 2780 Willow Pass Rd., Bay Point, CA 94565
TX - El Paso - 14751 Marina Ave., El Paso, TX 79938
IL - Electric Vehicle Auctions - Two Westbrook Corporate Center 10th Floo, Westchester, IL 60154
MD - Elkton - 183 Zeitler Rd, Elkton, MD 21921
NJ - Englishtown - 230 Pension Rd., Manalapan, NJ 07726
PA - Erie - 261 Hamilton Road, Garland, PA 16416
OR - Eugene - 1000 Bethel Dr., Eugene, OR 97402
ND - Fargo - 4401 37th St. N., Fargo, ND 58102
AR - Fayetteville - 2801 E. Pridemore Dr., Lincoln, AR 72744
MI - Flint - 3088 S. Dye Rd., Flint, MI 48507
CA - Fontana - 9951 Banana Ave., Fontana, CA 92335
FL - Fort Myers - 11950 State Road 82, Fort Myers, FL 33913
FL - Fort Pierce - 3798 Selvitz Rd, Fort Pierce, FL 34981
IN - Fort Wayne - 4300 Oxford St., Fort Wayne, IN 46806
TX - Fort Worth North - 3748 McPherson Dr., Justin, TX 76247
CA - Fremont - 6700 Stevenson Blvd., Fremont, CA 94538
CA - Fresno - 1805 N. Lafayette Ave., Fresno, CA 93705
MI - Grand Rapids - 700 100th St. S.W, Byron Center, MI 49315
NC - Greensboro - 171 Carden Rd., Graham, NC 27253
SC - Greenville - 422 Scuffletown Rd., Simpsonville, SC 29681
MS - Grenada - 101 Highway 404, Grenada, MS 38901
MS - Gulf Coast - 8209 Old Stage Rd., Moss Point, MS 39562
CT - Hartford - 47 Newberry Rd., East Windsor, CT 06088
CA - High Desert - 11385 G Ave., Hesperia, CA 92345
NC - High Point - 6695 Auction Road, High Point, NC 27263
HI - Honolulu - 91-401 Malakole St, Kapolei, HI 96707
TX - Houston - 2535 W. Mount Houston Rd., Houston, TX 77038
TX - Houston South - 2839 E. FM 1462 Rd., Rosharon, TX 77583
TX - Houston-North - 16602 E. Hardy Rd., Houston, TX 77032
AL - Huntsville - 16326 Ennis Rd., Athens, AL 35613
IN - Indianapolis - 3302 S. Harding St., Indianapolis, IN 46217
IN - Indianapolis South - 1947 S County Road SCR 1240E, Crothersville, IN 47229
MS - Jackson - 100 Auction Way, Byram, MS 39272
FL - Jacksonville - 186 Pecan Park Rd., Jacksonville, FL 32218
KS - Kansas City - 2663 S. 88th St., Kansas City, KS 66111
MO - Kansas City East - 1700 W. Old Highway 40, Odessa, MO 64076
TN - Knoxville - 3634 E. Governor John Sevier Hwy., Knoxville, TN 37914
LA - Lafayette - 301 Malapart Rd., Lafayette, LA 70507
NV - Las Vegas - 3225 South Hollywood Blvd, Las Vegas, NV 89122
SC - Lexington - 424 Two Notch Rd., Lexington, SC 29073
IL - Lincoln - 301 Madigan Dr., Lincoln, IL 62656
AR - Little Rock - 4900 S. Kerr Rd., Scott, AR 72142
NY - Long Island - 66 Peconic Ave., Medford, NY 11763
TX - Longview - 5577 E. U.S. Highway 80, Longview, TX 75605
CA - Los Angeles - 18300 S. Vermont Ave., Gardena, CA 90248
CA - Los Angeles South - 1903 Blinn Ave., Wilmington, CA 90744
KY - Louisville North - 891 Ballardsville Rd., Eminence, KY 40019
TX - Lubbock - 5311 N. County Road 2000, Lubbock, TX 79415
GA - Macon - 2200 Trade Dr., Macon, GA 31217
NH - Manchester - 75 Lowell Rd., Salem, NH 03079
TX - McAllen - 900 N. Hutto Rd., Donna, TX 78537
TN - Memphis - 3033 Fite Rd, Millington, TN 38053
MD - Metro DC - 14149 Brandywine Rd., Brandywine, MD 20613
FL - Miami-North - 20499 Stirling Rd., Southwest Ranches, FL 33332
WI - Milwaukee - N70W25277 Indian Grass Ln., Sussex, WI 53089
MN - Minneapolis South - 28261 Dressler Ct, Randolph, MN 55065
MN - Minneapolis/St. Paul - 1280 Jackson St., Saint Paul, MN 55117
MT - Missoula - 10131 Garrymore Ln., Missoula, MT 59808
NY - Monticello - 65 Kaufman Rd, Monticello, NY 12701
TN - Nashville - 3896 Stewarts Ln., Nashville, TN 37218
DE - New Castle - 417 Old Airport Rd., New Castle, DE 19720
LA - New Orleans East - 6600 Almonaster Ave., New Orleans, LA 70126
NY - Newburgh - 39 Stone Castle Rd., Rock Tavern, NY 12575
CA - North Hollywood - 7245 Laurel Canyon Blvd., North Hollywood, CA 91605
VA - Northern Virginia - 15 Le Way Dr., Fredericksburg, VA 22406
OK - Oklahoma City - 7300 N. I 35 Service Rd., Oklahoma City, OK 73121
NE - Omaha - 14749 Meredythe Plz., Springfield, NE 68059
NE - Omaha South - 13909 238th St, Greenwood, NE 68366
ME - Online Exclusive - 69 Hinckley Road, Clinton, ME 04927
FL - Orlando - 151 W. Taft Vineland Rd., Orlando, FL 32824
FL - Orlando-North - 2500 Adesa Dr., Sanford, FL 32773
KY - Paducah - 1701 Lane Rd., Paducah, KY 42003
FL - Pensacola - 11221 Highway 90, Milton, FL 32583
TX - Permian Basin - 701 W. 81st St., Odessa, TX 79764
PA - Philadelphia - 100 Industrial Way, Conshohocken, PA 19428
AZ - Phoenix - 2299 W. Broadway Rd., Phoenix, AZ 85041
PA - Pittsburgh - 57 Woodlawn Rd., Aliquippa, PA 15001
PA - Pittsburgh-North - 49 Bairdford Rd., Gibsonia, PA 15044
NJ - Port Murray - 985 Rt 57, Port Murray, NJ 07865
WI - Portage - W10321 State Road 16, Portage, WI 53901
OR - Portland - 4415 NE 158th Ave., Portland, OR 97230
ME - Portland - Gorham - 9 Moody Dr., Gorham, ME 04038
OR - Portland South - 605 S. Pacific Hwy, Woodburn, OR 97071
OR - Portland West - 10498 N. Vancouver Way, Portland, OR 97217
RI - Providence - 160 Amaral St., Riverside, RI 02915
UT - Provo - 1768 West 6300 South, Nephi, UT 84648
VA - Pulaski - 1250 E. Main St., Pulaski, VA 24301
NC - Raleigh - 60 Sadisco Rd., Clayton, NC 27520
IL - REC RIDES - Online-Exclusive - Two Westbrook Corporate Center, Tenth Fl, Westchester, IL 60154
NV - Reno - 4086 Peru Dr., Sparks, NV 89437
VA - Richmond - 10390 Sadisco Dr., Ashland, VA 23005
CA - Riverside - 3600 Pyrite St, Riverside, CA 92509-1103
VA - Roanoke - 1576 Quarterwood Rd., Montvale, VA 24122
NY - Rochester - 7149 Appletree Ave., Bergen, NY 14416
CA - Sacramento - 11499 Douglas Rd., Rancho Cordova, CA 95742
UT - Salt Lake City - 1800 S. 1100 W., Ogden, UT 84401
TX - San Antonio-South - 11275 S. Zarzamora St., San Antonio, TX 78224
CA - San Diego - 2380 Britannia Blvd., San Diego, CA 92154
CA - Santa Clarita - 14320 Soledad Canyon Rd, Santa Clarita, CA 91387
GA - Savannah - 348 Commerce Dr., Rincon, GA 31326
NJ - Sayreville - 580 Jernee Mill Rd., Sayreville, NJ 08872
PA - Scranton - 103 Thompson St., Pittston, PA 18640
WA - Seattle - 15801 110th Ave. E., Puyallup, WA 98374
WV - Shady Spring - 4163 Pluto Rd., Shady Spring, WV 25918
LA - Shreveport - 4836 McGee Rd., Greenwood, LA 71033
SD - Sioux Falls - 47028 276th St., Lennox, SD 57039
IN - South Bend - 25631 State Road 2, South Bend, IN 46619
NJ - Southern New Jersey - 250 Blackwood Barnsboro Rd., Turnersville, NJ 08012
IL - Specialty Division - 2040 E. Algonquin Rd., Schaumburg, IL 60173
WA - Spokane - 3520 N. Tschirley Rd., Spokane Valley, WA 99216
MO - Springfield - 1155 N Eldon Ave., Springfield, MO 65803
MN - St. Cloud - 13289 25th Ave NW, Rice, MN 56367
IL - St. Louis - 2436 Old Country Inn Dr., Caseyville, IL 62232
NY - Staten Island - 1900 South Avenue, Staten Island, NY 10314
CA - Stockton - 3235 Newton Road, Stockton, CA 95205
VA - Suffolk - 1389 Portsmouth Blvd., Suffolk, VA 23434
NY - Syracuse - 8459 Brewerton Rd., Cicero, NY 13039
FL - Tampa - 1208 17th St. East, Palmetto, FL 34221
FL - Tampa North - 8838 Bolton Ave., Hudson, FL 34667
MA - Taunton - 580 Myricks St., East Taunton, MA 02718
MA - Templeton - 223 Baldwinville Rd., Templeton, MA 01468
VA - Tidewater - 211 Production Dr., Yorktown, VA 23693
GA - Tifton - 368 Oakridge Church Rd., Tifton, GA 31794
AZ - Tucson - 4650 E. Irvington Rd., Tucson, AZ 85714
OK - Tulsa - 5311 W. 46th St., Tulsa, OK 74107
ME - Virtual Lane A - 69 Hinckley Rd, Clinton, ME 04927
ME - Virtual Lane B - 69 Hinckley Rd, Clinton, ME 04927
ME - Virtual Lane C - 69 Hinckley Rd, Clinton, ME 04927
FL - West Palm Beach - 14344 Corporate Rd S, Jupiter, FL 33478
CO - Western Colorado - 1280 Highway 50, Delta, CO 81416
KS - Wichita - 6335 N. Broadway Ave., Park City, KS 67219
NC - Wilmington - 415 Madeline Trask Dr., Castle Hayne, NC 28429
PA - York Springs - 10 Auction Dr., York Springs, PA 17372
`;

const rawCopartData = `
AB - Copart Calgary - 234082 84 STREET SE, T1X 0K2
AB - Copart Edmonton - 3175 4TH STREET, T9E 8L1
AK - Copart Anchorage - 401 W CHIPPERFIELD DR, 99501
AL - Copart Dothan - 10428 WEST US 84, 36352
AL - Copart Mobile South - 9401 OLD PASCAGOULA RD, 36582
AL - Copart Mobile - 4763 LOTT ROAD, 36613
AL - Copart Birmingham - 3101 DAVEY ALLISON BLVD, 35023
AL - Copart Montgomery - 6044 TROY HIGHWAY, 36116
AL - Copart Tanner - 20760 SANDY ROAD, 35671
AR - Copart Little Rock - 703 MAIN ST, 72032
AR - Copart Fayetteville - 15976 BILL CAMPBELL ROAD, 72753
AZ - Copart Phoenix - 615 SO. 51ST AVENUE, 85043
AZ - Copart Tuscon - 5600 S. ARCADIA AVENUE, 85706
CA - Copart Antelope - 8650 ANTELOPE NORTH ROAD, 95843
CA - Copart Bakersfield - 2216 COY AVENUE, 93307
CA - Copart San Bernardino - 1203 S. RANCHO AVENUE, 92324
CA - Copart Fresno - 1255 EAST CENTRAL, 93725
CA - Copart Hayward - 1964 SABRE STREET, 94545
CA - Copart Los Angeles - 8423 SOUTH ALAMEDA, 90001
CA - Copart Martinez - 2701 WATERFRONT ROAD, 94553
CA - Copart Rancho Cucamonga - 12167 ARROW ROUTE, 91739
CA - Copart South Sacramento - 8687 WEYAND AVE, 95828
CA - Copart Sacramento - 8600 MORRISON CREEK DRIVE, 95828
CA - Copart San Diego - 7847 AIRWAY ROAD, 92154
CA - Copart San Jose - 13895 LLAGAS AVENUE, 95046
CA - Copart Sun Valley - 11409 PENROSE STREET, 91352
CA - Copart Redding - 4603 LOCUST ROAD, 96007
CA - Copart Vallejo - 282 FIFTH STREET, 94590
CA - Copart Van Nuys - 7519 WOODMAN AVENUE, 91405
CA - Copart Long Beach - 1000E. LOMITA BLVD, 90744
CA - Copart Adelanto - 10429 PANSY RD, 92301
CO - Copart Denver - 1281 COUNTY ROAD 27, 80603
CO - Copart Colorado Springs - 3701 N. NEVADA AVE, 80907
CO - Copart Denver Central - 6464 DOWNING STREET, 80229
CO - Copart Denver South - 8300 BLAKELAND DRIVE, 80125
CT - Copart Hartford - 138 CHRISTIAN LANE, 06051
CT - Copart Hartford Springfield - 49 RUSSELL ROAD, 06026
DE - Copart Seaford - 26029 BETHEL CONCORD ROAD, 19973
FL - Copart Orlando North - 3352 W ORANGE BLOSSOM TRAIL, 32712
FL - Copart Ft. Pierce - 2601 CENTER ROAD, 34946
FL - Copart Miami South - 24301 SW 137TH AVE, 33032
FL - Copart Jacksonville North - 10200 ALTON BOX RD, 32218
FL - Copart Miami Central - 11858 NW 36TH AVE, 33167
FL - Copart Miami North - 12850 NW 27TH AVE, 33054
FL - Copart Tallahassee - 1825 COMMERCE BLVD, 32343
FL - Copart Ocala - 7100 NW 44 AVE, 34482
FL - Copart Orlando South - 307 EAST LANDSTREET ROAD, 32824
FL - Copart Punta Gorda - 5017 DUNCAN ROAD, 33982
FL - Copart Tampa South - 12020 US HIGHWAY 301 SOUTH, 33578
FL - Copart West Palm Beach - 7876 W BELVEDERE ROAD, 33411
GA - Copart Atlanta West - 2568 OLD ALABAMA ROAD, 30168
GA - Copart Cartersville - 1880 HWY 113, 30120
GA - Copart Atlanta South - 761 CLARK DRIVE, 30294
GA - Copart Atlanta North - 1602 ATHENS HIGHWAY, 30507
GA - Copart Fairburn - 6737 ROOSEVELT HWY, 30213
GA - Copart Atlanta East - 6089 HIGHWAY 20, 30052
GA - Copart Macon - 304 SMITH ROAD, 31008
GA - Copart Savannah - 5510 SILK HOPE ROAD, 31405
GA - Copart Tifton - 399 OAKRIDGE CHURCH RD, 31794
HI - Copart Honolulu - 91-542 AWAKUMOKO ST, 96707
IA - Copart Des Moines - 3300 VANDALIA ROAD, 50317
IA - Copart Davenport - 3601 S 1ST STREET, 52748
ID - Copart Boise - 3716 NORTH MIDDLETON ROAD, 83651
IL - Copart Southern Illinois - 99 RACEHORSE DRIVE, 62205
IL - Copart Chicago South - 89 E SAUK TRAIL, 60411
IL - Copart Chicago North - 1475 BLUFF CITY BLVD, 60120
IL - Copart Peoria - 350 VETERANS DRIVE, 61554
IL - Copart Wheeling - 110 EAST PALATINE ROAD, 60090
IN - Copart Dyer - 641 JOLIET ST, 46311
IN - Copart Cicero - 1461 E 226TH STREET, 46034
IN - Copart Fort Wayne - 3600 E. WASHINGTON BLVD., 46803
IN - Copart Hammond - 1849 SUMMER ST, 46320
IN - Copart Hartford City - 696 EAST STATE ROAD 26, 47348
IN - Copart Indianapolis - 4040 OFFICE PLAZA BLVD, 46254
KS - Copart Kansas City - 6211 KANSAS AVE, 66111
KS - Copart Wichita - 4510 S MADISON, 67216
KY - Copart Lexington West - 1051 INDUSTRY ROAD, 40342
KY - Copart Lexington East - 5801 KASP COURT, 40509
KY - Copart Earlington - 700 N SANDCUT RD, 42410
KY - Copart Louisville - 3100 POND STATION RD, 40272
KY - Copart Walton - 13273 DIXIE HIGHWAY, 41094
LA - Copart Baton Rouge - 21595 GREENWELL SPRINGS RD, 70739
LA - Copart New Orleans - 14600 OLD GENTILLY RD, 70129
LA - Copart Shreveport - 5235 GREENWOOD RD, 71109
MA - Copart South Boston - 82 CAPE ROAD, 01756
MA - Copart North Boston - 55R HIGH ST, 01682
MA - Copart West Warren - 600 OLD WEST WARREN RD, 01092
MD - Copart Baltimore - 2251 OLD WESTMINSTER PIKE, 21048
MD - Copart Washington Dc - 11055 BILLINGSLEY ROAD, 20602
MD - Copart Baltimore East - 601 W PATAPSCO AVE, 21225
ME - Copart Lyman - 136 KENNEBUNK POND ROAD, 04002
MI - Copart Flint - 5000 N STATE ROAD, 48243
MI - Copart Kincheloe - 5030 W KINCHELOE ROAD, 49788
MI - Copart Lansing - 3902 SOUTH CANAL RD, 48917
MI - Copart Ionia - 8460 S STATE ROAD, 48875
MI - Copart Detroit - 21000 HAYDEN DRIVE, 48183
MN - Copart St. Cloud - 200 COUNTY ROAD 159, 56310
MN - Copart Minneapolis - 10588 CENTRAL AVE NE, 55434
MN - Copart Minneapolis North - 1526 BUNKER LAKE BLVD, 55304
MO - Copart St. Louis - 13033 TAUSSIG AVE, 63044
MO - Copart Columbia - 8485 RICHLAND RD, 65201
MO - Copart Springfield - 2889 E US HIGHWAY 60, 65742
MO - Copart Sikeston - 687 E OUTER RD, 63801
MS - Copart Jackson - 205 S RANKIN INDUSTRIAL DRIVE, 39073
MT - Copart Billings - 1090 ISLAND PARK RD, 59101
MT - Copart Helena - 3333 BOZEMAN AVENUE, 59601
NB - Copart Moncton - 1300 BERRY MILLS RD, E1E 4R8
NC - Copart China Grove - 1081 RECOVERY ROAD, 28023
NC - Copart Concord - 7940 U.S. HIGHWAY 601 S., 28025
NC - Copart Raleigh North - 1900 OLD CREWS RD, 27545
NC - Copart Raleigh - 310 COPART ROAD, 28334
NC - Copart Lumberton - 4019 NC 72 HWY W, 28360
NC - Copart Gastonia - 1900 OLD CREWS RD, 27545
NC - Copart Mebane - 1870 US 70 HWY, 27302
NC - Copart Mocksville - 2668 US-601, 27028
ND - Copart Bismarck - 3700 APPLE CREEK RD, 58501
NE - Copart Lincoln - 13603 238TH ST, 68366
NH - Copart Candia - 134 RAYMOND RD, 03034
NJ - Copart Glassboro East - 200 GROVE ST, 08028
NJ - Copart Glassboro West - 781 JACOB HARRIS AVENUE, 08028
NJ - Copart Somerville - 2124 WEST CAMPLAIN ROAD, 08844
NJ - Copart Trenton - 108 N MAIN STREET, 08561
NM - Copart Albuquerque - 7705 BROADWAY SE, 87105
NS - Copart Halifax - 128 PARK ROAD, B2S 2L3
NV - Copart Las Vegas - 4810 N LAMB BLVD, 89115
NV - Copart Reno - 9915 N VIRGINIA STREET, 89506
NY - Copart Albany - 1916 CENTRAL AVE, 12205
NY - Copart Buffalo - 8418 SOUTHWESTERN BLVD., 14006
NY - Copart Long Island - 1983 MONTAUK HIGHWAY, 11719
NY - Copart Syracuse - 46 ZUK-PIERCE RD, 13036
NY - Copart Rochester - 4 WEST AVE, 14482
NY - Copart Newburgh - 91 RIVERVIEW DRIVE, 12542
OH - Copart Cleveland West - 34417 E ROYALTON ROAD, 44028
OH - Copart Colombus - 1680 WILLIAMS ROAD, 43207
OH - Copart Dayton - 4691 SPRINGBORO PIKE, 45439
OH - Copart Cleveland East - 286 EAST TWINSBURG ROAD, 44067
OK - Copart Oklahoma City - 2829 SE 15TH STREET, 73129
OK - Copart Tulsa - 2408 W 21ST STREET, 74107
ON - Copart London - 1809 GORE ROAD, N5W 6C8
ON - Copart Toronto - 175 OSBORNE ROAD, L1E 2R3
OR - Copart Eugene - 29815 END ROAD EAST, 97402
OR - Copart Portland North - 6900 NE CORNFOOT DRIVE, 97218
OR - Copart Portland South - 2885 NATIONAL WAY, 97071
PA - Copart Chambersburg - 2962 LINCOLN WAY WEST, 17201
PA - Copart Scranton - 210 MCALPINE STREET, 18642
PA - Copart Altoona - 4007 ADMIRAL PEARY HWY, 15931
PA - Copart Pittsburgh North - 2000 RIVER ROAD, 16117
PA - Copart Harrisburg - 8 PARK DRIVE, 17028
PA - Copart Philadelphia - 2704 GERYVILLE PIKE, 18073
PA - Copart Philadelphia East - 77 BRISTOL ROAD, 18914
PA - Copart Pittsburgh West - 1451 LEBANON SCHOOL ROAD, 15122
PA - Copart Pittsburgh South - 526 THOMPSON RUN RD, 15122
PA - Copart York Haven - 795 SIPE RD, 17370
QC - Copart Montreal - 6900 MARIEN AVENUE, H1B 4W3
RI - Copart Exeter - 10 INDUSTRIAL DRIVE, 02822
SC - Copart Columbia - 4324 HIGHWAY 321 SOUTH, 29053
SC - Copart Spartanburg - 1922 NAZARETH CHURCH ROAD, 29301
SC - Copart North Charleston - 120 COMMERCE AVE, 29448
TN - Copart Nashville - 865 STUMPY LANE, 37090
TN - Copart Knoxville - 6355 B HIGHWAY 411, 37354
TN - Copart Memphis - 5545 SWINNEA RD, 38118
TX - Copart Abilene - 2630 FM ROAD #3034, 79601
TX - Copart Amarillo - 3999 S LOOP 335 E, 79118
TX - Copart Andrews - 1975 SOUTH WEST 860, 79714
TX - Copart El Paso - 501 VALLEY CHILI RD, 79821
TX - Crashedtoys Dallas - 7777 JOHN W CARPENTER FREEWAY, 75247
TX - Copart Dallas - 505 IDLEWILD ROAD, 75051
TX - Copart Houston East - 15706 BEAUMONT HWY, 77049
TX - Copart Ft. Worth - 950 BLUE MOUND ROAD WEST, 76052
TX - Copart Houston - 1655 RANKIN ROAD, 77073
TX - Copart Longview - 3046 HIGHWAY 322 SOUTH, 75603
TX - Copart Lufkin - 3700 OLD UNION ROAD, 75904
TX - Copart Mcallen - 301 MILE 1 EAST, 78570
TX - Copart Austin - 8725 N INTERSTATE 35, 78130
TX - Copart San Antonio - 11130 APPLEWHITE RD, 78224
TX - Copart Waco - 7201 N GENERAL BRUCE DR, 76501
TX - Copart Dallas South - 1701 EAST BELTLINE RD, 75172
UT - Copart Ogden - 3586 NORTH 2000 WEST, 84404
UT - Copart Salt Lake City - 7320 WEST 2100 SOUTH, 84044
VA - Copart Richmond East - 6300 CHAMBERS ROAD, 23030
VA - Copart Danville - 12360 US HWY 29, 24531
VA - Copart Fredericksburg - 4717 MASSAPONAX CHURCH ROAD, 22408
VA - Copart Hampton - 16 NETTLES LANE, 23666
VA - Copart Richmond - 5701 WHITESIDE RD, 23150
WA - Copart Spokane - 11019 WEST MCFARLANE ROAD, 99001
WA - Copart North Seattle - 16701 51ST AVE NE, 98223
WA - Copart Graham - 21421 MERIDIAN E, 98338
WA - Copart Pasco - 3333 N RAILROAD AVENUE, 99301
WI - Copart Appleton - 2500 AMERICAN DRIVE, 54914
WI - Copart Milwaukee North - 9201 N 107TH ST, 54914
WI - Copart Milwaukee - 4825 S WHITNALL AVE, 53110
WI - Copart Madison - 5448 LIEN ROAD, 53718
WV - Copart Charleston - 1746 US ROUTE 60, 25526
WY - Copart Casper - 1998 OIL FIELD CENTER RD, 82604
`;

/**
 * Parses a raw string of location data into an array of objects.
 * @param {string} rawData The raw string data.
 * @returns {Array<{state: string, name: string, address: string, full: string}>}
 */
const parseLocations = (rawData) => {
  return rawData
    .trim()
    .split('\n')
    .map(line => {
      const parts = line.split(' - ');
      if (parts.length < 3) return null; // Ignore malformed lines
      const state = parts[0].trim();
      const name = parts[1].trim();
      const address = parts.slice(2).join(' - ').trim();
      return {
        state,
        name,
        address,
        full: `${name} - ${address}`, // The value for the dropdown
      };
    })
    .filter(Boolean); // Remove any null entries
};

/**
 * Groups an array of location objects by state.
 * @param {Array<object>} locations The array of parsed location objects.
 * @returns {object} An object with states as keys and arrays of locations as values.
 */
const groupLocationsByState = (locations) => {
  return locations.reduce((acc, location) => {
    const { state } = location;
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(location);
    return acc;
  }, {});
};

const allIaaLocations = parseLocations(rawIaaData);
const allCopartLocations = parseLocations(rawCopartData);

export const groupedIaaLocations = groupLocationsByState(allIaaLocations);
export const groupedCopartLocations = groupLocationsByState(allCopartLocations);

// We also export the flat lists in case they are needed
export const flatIaaLocations = allIaaLocations;
export const flatCopartLocations = allCopartLocations;