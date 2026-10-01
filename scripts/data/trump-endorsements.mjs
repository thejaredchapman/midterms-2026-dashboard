// Trump 2026 endorsements as listed by the Washington Examiner endorsement tracker (retrieved 2026-10-01 via a fetch tool that
// summarizes the page — treat as a SECONDARY source). Used only to set trump:true when name + state match a candidate.
// A name missing from this list does NOT mean Trump hasn't endorsed; it just stays "Unverified".
export const TRACKER = {
  label: 'Washington Examiner — Trump endorsement tracker',
  url: 'https://www.washingtonexaminer.com/news/campaigns/congressional/4460164/trump-endorsement-tracker-gop-2026-election-primaries/',
};

const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

// Senate: [name, state]
export const SENATE = [
  ['Dan Sullivan', 'AK'], ['Jim Risch', 'ID'], ['Roger Marshall', 'KS'], ['Andy Barr', 'KY'], ['Julia Letlow', 'LA'], ['Susan Collins', 'ME'],
  ['Mike Rogers', 'MI'], ['Michael Whatley', 'NC'], ['Jon Husted', 'OH'], ['Kevin Hern', 'OK'], ['Mike Rounds', 'SD'], ['Bill Hagerty', 'TN'],
  ['Ken Paxton', 'TX'], ['Shelley Moore Capito', 'WV'], ['Harriet Hageman', 'WY'], ['Tom Cotton', 'AR'], ['Barry Moore', 'AL'], ['Tommy Tuberville', 'AL'],
  ['Ashley Hinson', 'IA'], ['Cindy Hyde-Smith', 'MS'], ['Steve Daines', 'MT'], ['Pete Ricketts', 'NE'], ['Lindsey Graham', 'SC'], ['Darline Graham Nordone', 'SC'],
  ['Ashley Moody', 'FL'],
].map(([name, state]) => ({ name, state, office: 'Senate' }));

export const GOVERNOR = [
  ['Sarah Huckabee Sanders', 'AR'], ['Andy Biggs', 'AZ'], ['Steve Hilton', 'CA'], ['Brad Little', 'ID'], ['Mike Lindell', 'MN'], ['Jim Pillen', 'NE'],
  ['Joe Lombardo', 'NV'], ['Stacy Garrity', 'PA'], ['Burt Jones', 'GA'], ['Rick Jackson', 'GA'], ['Vivek Ramaswamy', 'OH'], ['Greg Abbott', 'TX'],
  ['Marsha Blackburn', 'TN'], ['Tom Tiffany', 'WI'], ['Byron Donalds', 'FL'], ['Alan Wilson', 'SC'], ['Pamela Evette', 'SC'], ['Bruce Blakeman', 'NY'],
  ['Ty Masterson', 'KS'], ['John James', 'MI'],
].map(([name, state]) => ({ name, state, office: 'Governor' }));

const HOUSE_BY_STATE = {
  AL: 'Barry Moore, Mike Rogers, Robert Aderholt, Dale Strong, Rhett Marques, Jerry Carl, Gary Palmer',
  AK: 'Nick Begich',
  AZ: 'Eli Crain, Juan Ciscomani, Jay Feely, Abraham Hamadeh, Paul Gosar, Mark Lamb',
  CA: 'Kevin Lincoln II, James Gallagher, Vince Fong, Jay Obernolte, Tom McClintock, Jim Desmond',
  CO: 'Lauren Boebert, Jeff Crank, Gabe Evans, Will Hurd',
  FL: 'Sydney Gruters, Gus Bilirakis, Anna Paulina Luna, Laurel Lee, John Rutherford, Aaron Bean, Greg Steube, Scott Franklin, Carlos Gimenez, Mario Diaz-Balart, Kat Cammack, Randy Fine, Mike Haridopolos, Maria Elvira Salazar, Brian Mast, Jimmy Patronis, Catalina Lauf, Cory Mills, Ryan Elijah, Neal Dunn, Vern Buchanan, Jon Maples, Bill Conerly, Jon Albert, J.J. Grow, Kim Kendall, Meg Weinberger',
  GA: 'Mike Collins, Rich McCormick, Austin Scott, Brian Jack, Rick Allen, Andrew Clyde, Clay Fuller, Houston Gaines, Barry Loudermilk, Jim Kingston, John Cowan',
  ID: 'Russ Fulcher, Mike Simpson',
  IL: 'Mike Bost, Mary Miller, Darin LaHood',
  IN: 'Marlin Stutzman, Jim Baird, Victoria Spartz, Jefferson Shreve, Mark Messmer, Rudy Yakym, Erin Houchin, Barb Regnitz, Tracey Powell, Paula Copenhaver, Blake Fiechter, Jeff Ellington, Brenda Wilson, Michelle Davis',
  IA: 'Ashley Hinson, Mariannette Miller-Meeks, Zach Nunn, Joe Mitchell, Chris McGowen, Randy Feenstra',
  KS: 'Tracy Mann, Derek Schmidt, Ron Estes',
  KY: 'James Comer, Brett Guthrie, Ed Gallrein, Hal Rogers',
  LA: 'Steve Scalise, Clay Higgins, Mike Johnson',
  ME: 'Paul LePage',
  MD: 'Andy Harris',
  MI: 'Bill Huizenga, Jack Bergman, John Moolenaar, Tim Walberg, Tom Barrett, Lisa McClain, Amir Hassan, Mike Bouchard',
  MN: 'Brad Finstad, Tom Emmer, Michelle Fischbach, Pete Stauber',
  MS: 'Trent Kelly, Michael Guest, Mike Ezell',
  MO: 'Ann Wagner, Bob Onder, Mark Alford, Eric Burlison, Jason Smith, Rick Brattin',
  MT: 'Ryan Zinke, Troy Downing',
  NE: 'Mike Flood, Adrian Smith, Brinker Harding',
  NV: 'David Flippo, Marty O\'Donnell, Carrie Buck, Adriana Guzmán Fralick',
  NH: 'Anthony DiLorenzo',
  NJ: 'Jeff Van Drew, Chris Smith, Thomas Kean Jr.',
  NM: 'Greg Cunningham',
  NY: 'Nick LaLota, Nicole Malliotakis, Mike Lawler, Andrew Garbarino, Nick Langworthy, Claudia Tenney, Anthony Constantino, Mike LiPetri, Peter Oberacker, Jeanine Driscoll',
  NC: 'Pat Harrigan, Chuck Edwards, Brad Knott, Tim Moore, Greg Murphy, Virginia Foxx, Addison McDowell, David Rouzer, Mark Harris, Richard Hudson',
  ND: 'Julie Fedorchak',
  OH: 'Michael Turner, Troy Balderson, David Joyce, Mike Carey, David Taylor, Jim Jordan, Bob Latta, Michael Rulli, Max Miller, Warren Davidson, Eric Conroy',
  OK: 'Josh Brecheen, Frank Lucas, Tom Cole, Stephanie Bice, Jackson Lahmeyer, Mark Tedford',
  OR: 'Cliff Bentz',
  PA: 'Scott Perry, Lloyd Smucker, John Joyce, Guy Reschenthaler, Glenn Thompson, Mike Kelly, Ryan Mackenzie, Rob Bresnahan Jr., Dan Meuser',
  SC: 'Joe Wilson, Sheri Biggs, William Timmons, Russell Fry',
  SD: 'Marty Jackley',
  TN: 'Diana Harshbarger, Tim Burchett, Chuck Fleischmann, Scott DesJarlais, Andy Ogles, Matt Van Epps, David Kustoff, Brent Taylor',
  TX: 'Nathaniel Moran, Chris Gober, August Pfluger, Craig Goldman, Ronny Jackson, Randy Weber, Monica De La Cruz, Pete Sessions, Jodey Arrington, Mark Teixeira, Trever Nehls, Tony Gonzales, Beth Van Duyne, Roger Williams, Brandon Gill, Michael Cloud, Tano Tijerina, Keith Self, John Carter, Eric Flores, Brian Babin, Pat Fallon, Lance Gooden, Jake Ellzey, Jon Bonck, Carlos De La Cruz, Alex Mealer, Jace Yarbrough, Jessica Steinmann, Steve Toth, Brandon Herrera, Tom Sell',
  UT: 'Blake Moore, Celeste Maloy, Mike Kennedy, Burgess Owens',
  WA: 'Amanda McKinney, Michael Baumgartner',
  WI: 'Bryan Steil, Derrick Van Orden, Scott Fitzgerald, Glenn Grothman, Tony Wied, Michael Alfonso',
};
export const HOUSE = Object.entries(HOUSE_BY_STATE).flatMap(([state, names]) => list(names).map((name) => ({ name, state, office: 'House' })));

export const ALL = [...SENATE, ...GOVERNOR, ...HOUSE];
