'use strict';

const React = require('react');
const {
  Header
} = require('semantic-ui-react');


class AdminDesign extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'SENSEMAKER',
        name: 'sensemaker',
        statistics: {
          counts: {
            waitlist: 0,
            pending: 0, // pending invitations
            users: 0,
            conversations: 0,
            messages: 0,
            documents: 0
          }
        },
        waitlistSignupCount: 0,
        currentPage: 1,
        activeIndex: 0,
        windowWidth: window.innerWidth,
        currentPane:'',
      }
    }, props);
    this.state = this.settings.state;
  }

  render() {


    return (
      <adminDesignTab>

      <Header as='h3'>Style Guide</Header>
      <Header as='h4'>Site</Header>
      <div class="ui three column stackable grid">
        <div class="column">
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <p>Nullam quis risus eget urna mollis ornare vel eu leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam id dolor id nibh ultricies vehicula.</p>
        </div>
        <div class="column">
          <h2>Example body text</h2>
          <p>Nullam quis risus eget <a href="#">urna mollis ornare</a> vel eu leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam id dolor id nibh ultricies vehicula.</p>
          <p><small>This line of text is meant to be treated as fine print.</small></p>
          <p>The following snippet of text is <strong>rendered as bold text</strong>.</p>
          <p>The following snippet of text is <em>rendered as italicized text</em>.</p>
          <p>An abbreviation of the word attribute is <abbr title="attribute">attr</abbr>.</p>
        </div>
        <div class="column">
          <div class="ui three column stackable padded middle aligned centered color grid">
            <div class="red column">Red</div>
            <div class="orange column">Orange</div>
            <div class="yellow column">Yellow</div>
            <div class="olive column">Olive</div>
            <div class="green column">Green</div>
            <div class="teal column">Teal</div>
            <div class="blue column">Blue</div>
            <div class="violet column">Violet</div>
            <div class="purple column">Purple</div>
            <div class="pink column">Pink</div>
            <div class="brown column">Brown</div>
            <div class="grey column">Grey</div>
            <div class="black column">Black</div>
          </div>
        </div>
        {/* <Header as='h4'>Menu</Header>
        <div class="ui menu">
          <div class="header item">Brand</div>
          <a class="active item">Link</a>
          <a class="item">Link</a>
          <div class="ui dropdown item" tabindex="0">
            Dropdown
            <i class="dropdown icon" />
            <div class="menu" tabindex="-1">
              <div class="item">Action</div>
              <div class="item">Another Action</div>
              <div class="item">Something else here</div>
              <div class="divider"></div>
              <div class="item">Separated Link</div>
              <div class="divider"></div>
              <div class="item">One more separated link</div>
            </div>
          </div>
          <div class="right menu">
            <div class="item">
              <div class="ui action left icon input">
                <i class="search icon" />
                <input type="text" placeholder="Search" />
                <button class="ui button">Submit</button>
              </div>
            </div>
            <a class="item">Link</a>
          </div>
        </div>
        <div class="ui inverted menu">
          <div class="header item">Brand</div>
          <div class="active item">Link</div>
          <a class="item">Link</a>
          <div class="ui dropdown item" tabindex="0">
            Dropdown
            <i class="dropdown icon" />
            <div class="menu" tabindex="-1">
              <div class="item">Action</div>
              <div class="item">Another Action</div>
              <div class="item">Something else here</div>
              <div class="divider"></div>
              <div class="item">Separated Link</div>
              <div class="divider"></div>
              <div class="item">One more separated link</div>
            </div>
          </div>
          <div class="right menu">
            <div class="item">
              <div class="ui transparent inverted icon input">
                <i class="search icon" />
                <input type="text" placeholder="Search" />
              </div>
            </div>
            <a class="item">Link</a>
          </div>
        </div>
        <div class="ui secondary menu">
          <div class="active item">Link</div>
          <a class="item">Link</a>
          <div class="ui dropdown item" tabindex="0">
            Dropdown
            <i class="dropdown icon" />
            <div class="menu" tabindex="-1">
              <div class="item">Action</div>
              <div class="item">Another Action</div>
              <div class="item">Something else here</div>
              <div class="divider"></div>
              <div class="item">Separated Link</div>
              <div class="divider"></div>
              <div class="item">One more separated link</div>
            </div>
          </div>
          <div class="right menu">
            <div class="item">
              <div class="ui action left icon input">
                <i class="search icon" />
                <input type="text" placeholder="Search" />
                <button class="ui button">Submit</button>
              </div>
            </div>
            <div class="ui dropdown item" tabindex="0">
              Dropdown Left<i class="dropdown icon" />
              <div class="menu" tabindex="-1">
                <a class="item">Link</a>
                <a class="item">Link</a>
                <div class="divider"></div>
                <div class="header">Header</div>
                <div class="item">
                  <i class="dropdown icon" />
                  Sub Menu
                  <div class="menu">
                    <a class="item">Link</a>
                    <div class="item">
                      <i class="dropdown icon" />
                      Sub Sub Menu
                      <div class="menu">
                        <a class="item">Link</a>
                        <a class="item">Link</a>
                      </div>
                    </div>
                    <a class="item">Link</a>
                  </div>
                </div>
                <a class="item">Link</a>
              </div>
            </div>
            <a class="item">Link</a>
          </div>
        </div>
        <div class="ui three column doubling grid">
          <div class="column">
            <div class="ui secondary pointing menu">
              <div class="active item">Link</div>
              <a class="item">Link</a>
              <a class="item">Link</a>
            </div>
          </div>
          <div class="column">
            <div class="ui tabular menu">
              <div class="active item">Link</div>
              <a class="item">Link</a>
              <a class="item">Link</a>
            </div>
          </div>
          <div class="column">
            <div class="ui pointing menu">
              <div class="active item">Link</div>
              <a class="item">Link</a>
              <div class="right item">
                Right Text
              </div>
            </div>
          </div>
        </div> */}
        <Header as='h4'>Buttons</Header>
        <div class="ui stackable equal width grid">
          <div class="column">
            <button class="ui button">Default</button>
            <button class="ui primary button">Primary</button>
            <button class="ui secondary button">Secondary</button>
            <button class="ui basic button">Basic</button>
            <button class="ui compact button">
              Compact
            </button>
            <div class="ui divider"></div>
            <button class="ui icon button">
              <i class="heart icon" />
            </button>
            <button class="ui labeled icon button">
              <i class="heart icon" />
              Labeled
            </button>
            <button class="ui right labeled icon button">
              <i class="heart icon" />
              Labeled
            </button>
            <div class="ui divider"></div>
            <div class="ui buttons">
              <button class="ui button">Combo</button>
              <div class="ui floating dropdown icon button" tabindex="0">
                <i class="dropdown icon" />
                <div class="menu" tabindex="-1">
                  <div class="item">Choice 1</div>
                  <div class="item">Choice 2</div>
                  <div class="item">Choice 3</div>
                </div>
              </div>
            </div>
            <div class="ui floating search dropdown button">
              <input class="search" autocomplete="off" tabindex="0" />
              <span class="text">Search Dropdown</span>
              <div class="menu" tabindex="-1">
                <div class="item">Arabic</div>
                <div class="item">Chinese</div>
                <div class="item">Danish</div>
                <div class="item">Dutch</div>
                <div class="item">English</div>
                <div class="item">French</div>
                <div class="item">German</div>
                <div class="item">Greek</div>
                <div class="item">Hungarian</div>
                <div class="item">Italian</div>
                <div class="item">Japanese</div>
                <div class="item">Korean</div>
                <div class="item">Lithuanian</div>
                <div class="item">Persian</div>
                <div class="item">Polish</div>
                <div class="item">Portuguese</div>
                <div class="item">Russian</div>
                <div class="item">Spanish</div>
                <div class="item">Swedish</div>
                <div class="item">Turkish</div>
                <div class="item">Vietnamese</div>
              </div>
            </div>
            <div class="ui divider"></div>
            <div class="ui animated button" tabindex="0">
              <div class="visible content">Horizontal</div>
              <div class="hidden content">
                Hidden
              </div>
            </div>
            <div class="ui vertical animated button" tabindex="0">
              <div class="visible content">Vertical</div>
              <div class="hidden content">
                Hidden
              </div>
            </div>
            <div class="ui animated fade button" tabindex="0">
              <div class="visible content">Fade In</div>
              <div class="hidden content">
                Hidden
              </div>
            </div>
            <div class="ui divider"></div>
            <button class="ui disabled button">Disabled</button>
            <button class="ui loading button">Loading</button>
            <div class="ui divider"></div>
            <div class="ui buttons">
              <button class="ui button">1</button>
              <button class="ui button">2</button>
              <button class="ui button">3</button>
            </div>
            <div class="ui icon buttons">
              <button class="ui button"><i class="align left icon" /></button>
              <button class="ui button"><i class="align center icon" /></button>
              <button class="ui button"><i class="align right icon" /></button>
              <button class="ui button"><i class="align justify icon" /></button>
            </div>
            <div class="ui buttons">
              <button class="ui button">1</button>
              <div class="or"></div>
              <button class="ui button">2</button>
            </div>
            <div class="ui divider"></div>
            <div class="ui two top attached buttons">
              <div class="ui button">One</div>
              <div class="ui button">Two</div>
            </div>
            <div class="ui attached segment">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/paragraph.png" class="ui wireframe image" />
            </div>
            <div class="ui two bottom attached buttons">
              <div class="ui button">One</div>
              <div class="ui button">Two</div>
            </div>
          </div>
          <div class="column">
            <button class="ui mini button">Mini</button>
            <button class="ui tiny button">Tiny</button>
            <button class="ui small button">Small</button>
            <button class="ui large button">Large</button>
            <button class="ui big button">Big</button>
            <button class="ui huge button">Huge</button>
            <button class="ui massive button">Massive</button>
            <div class="ui divider"></div>
            <div class="spaced">
              <button class="yellow ui button">Yellow</button>
              <button class="orange ui button">Orange</button>
              <button class="green ui button">Green</button>
              <button class="teal ui button">Teal</button>
              <button class="blue ui button">Blue</button>
              <button class="purple ui button">Purple</button>
              <button class="pink ui button">Pink</button>
              <button class="red ui button">Red</button>
              <button class="black ui button">Black</button>
            </div>
            <div class="ui divider"></div>
            <div class="ui inverted segment">
              <button class="ui inverted button">Inverted</button>
              <button class="ui inverted basic button">Basic</button>
              <button class="ui inverted blue button">Colored</button>
              <button class="ui inverted blue basic button">Basic Colored</button>
            </div>
          </div>
        </div>
        <br className="clearfix" />
        <Header as='h4'>Table</Header>
        <br className="clearfix" />
        <div>
          <div class="ui stackable two column grid">
            <br className="clearfix" />
            <div class="column">
              <table class="ui right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Delmar</td>
                    <td>36</td>
                    <td>36g</td>
                    <td>2g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Louise</td>
                    <td>24</td>
                    <td>24g</td>
                    <td>29g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Terrell</td>
                    <td>22</td>
                    <td>11g</td>
                    <td>9g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Marion</td>
                    <td>7</td>
                    <td>35g</td>
                    <td>3g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Clayton</td>
                    <td>7</td>
                    <td>38g</td>
                    <td>20g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui right aligned celled table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Drema</td>
                    <td class="positive">15</td>
                    <td class="negative">26g</td>
                    <td class="warning">8g</td>
                  </tr>
                  <tr class="positive">
                    <td class="left aligned">Nona</td>
                    <td>11</td>
                    <td>21g</td>
                    <td>16g</td>
                  </tr>
                  <tr class="negative">
                    <td class="left aligned">Isidra</td>
                    <td>34</td>
                    <td>43g</td>
                    <td>11g</td>
                  </tr>
                  <tr class="warning">
                    <td class="left aligned">Bart</td>
                    <td>41</td>
                    <td>40g</td>
                    <td>30g</td>
                  </tr>
                  <tr class="selected">
                    <td class="left aligned">Nguyet</td>
                    <td>41</td>
                    <td>44g</td>
                    <td>28g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui basic right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Mirna</td>
                    <td>1</td>
                    <td>28g</td>
                    <td>29g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Fernando</td>
                    <td>38</td>
                    <td>2g</td>
                    <td>48g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Lisette</td>
                    <td>18</td>
                    <td>9g</td>
                    <td>23g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Ahmad</td>
                    <td>42</td>
                    <td>26g</td>
                    <td>49g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Laquanda</td>
                    <td>27</td>
                    <td>27g</td>
                    <td>49g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui very basic right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Drema</td>
                    <td>15</td>
                    <td>26g</td>
                    <td>8g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Nona</td>
                    <td>11</td>
                    <td>21g</td>
                    <td>16g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Isidra</td>
                    <td>34</td>
                    <td>43g</td>
                    <td>11g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Bart</td>
                    <td>41</td>
                    <td>40g</td>
                    <td>30g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Nguyet</td>
                    <td>41</td>
                    <td>44g</td>
                    <td>28g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui celled selectable right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Tasia</td>
                    <td>12</td>
                    <td>7g</td>
                    <td>21g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Ronnie</td>
                    <td>38</td>
                    <td>37g</td>
                    <td>38g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Gabriel</td>
                    <td>30</td>
                    <td>46g</td>
                    <td>46g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Logan</td>
                    <td>12</td>
                    <td>21g</td>
                    <td>39g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Clare</td>
                    <td>39</td>
                    <td>41g</td>
                    <td>2g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui striped right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Rosaline</td>
                    <td>5</td>
                    <td>35g</td>
                    <td>6g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Barrie</td>
                    <td>27</td>
                    <td>23g</td>
                    <td>28g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Trinidad</td>
                    <td>14</td>
                    <td>50g</td>
                    <td>7g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Jaqueline</td>
                    <td>31</td>
                    <td>30g</td>
                    <td>50g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Tamala</td>
                    <td>18</td>
                    <td>6g</td>
                    <td>13g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui padded celled right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Lianne</td>
                    <td>23</td>
                    <td>32g</td>
                    <td>43g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Joette</td>
                    <td>21</td>
                    <td>13g</td>
                    <td>31g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Le</td>
                    <td>28</td>
                    <td>39g</td>
                    <td>23g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Sacha</td>
                    <td>46</td>
                    <td>43g</td>
                    <td>13g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Bruna</td>
                    <td>9</td>
                    <td>47g</td>
                    <td>12g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui definition celled right aligned table">
                <thead>
                  <tr><th></th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Lianne</td>
                    <td>23</td>
                    <td>32g</td>
                    <td>43g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Joette</td>
                    <td>21</td>
                    <td>13g</td>
                    <td>31g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Le</td>
                    <td>28</td>
                    <td>39g</td>
                    <td>23g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Sacha</td>
                    <td>46</td>
                    <td>43g</td>
                    <td>13g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Bruna</td>
                    <td>9</td>
                    <td>47g</td>
                    <td>12g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui inverted right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Lianne</td>
                    <td>23</td>
                    <td>32g</td>
                    <td>43g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Joette</td>
                    <td>21</td>
                    <td>13g</td>
                    <td>31g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Le</td>
                    <td>28</td>
                    <td>39g</td>
                    <td>23g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Sacha</td>
                    <td>46</td>
                    <td>43g</td>
                    <td>13g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Bruna</td>
                    <td>9</td>
                    <td>47g</td>
                    <td>12g</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column">
              <table class="ui inverted blue selectable celled right aligned table">
                <thead>
                  <tr><th class="left aligned">Person</th>
                  <th>Calories</th>
                  <th>Fat</th>
                  <th>Protein</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td class="left aligned">Lianne</td>
                    <td>23</td>
                    <td>32g</td>
                    <td>43g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Joette</td>
                    <td>21</td>
                    <td>13g</td>
                    <td>31g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Le</td>
                    <td>28</td>
                    <td>39g</td>
                    <td>23g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Sacha</td>
                    <td>46</td>
                    <td>43g</td>
                    <td>13g</td>
                  </tr>
                  <tr>
                    <td class="left aligned">Bruna</td>
                    <td>9</td>
                    <td>47g</td>
                    <td>12g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className='clearfix'></div>
        </div>
        <div class='clearfix'></div>
        <Header as='h4'>Input</Header>
        <div class='clearfix'></div>
        <div>
          <div class="ui two column stackable grid">
            <div class="column">
              <div class="ui action left icon input">
                <i class="search icon" />
                <input type="text" placeholder="Search..." />
                <div class="ui teal button">Search</div>
              </div>
              <div class="ui divider"></div>
              <div class="ui input error">
                <input placeholder="Search..." type="text" />
              </div>
              <div class="ui divider"></div>
              <div class="ui right labeled input">
                <input placeholder="Placeholder" type="text" />
                <div class="ui dropdown label" tabindex="0">
                  <div class="text">Dropdown</div>
                  <i class="dropdown icon" />
                  <div class="menu" tabindex="-1">
                    <div class="item">Choice 1</div>
                    <div class="item">Choice 2</div>
                    <div class="item">Choice 3</div>
                  </div>
                </div>
              </div>
              <div class="ui divider"></div>
              <div class="ui transparent icon input">
                <input placeholder="Search..." type="text" />
                <i class="search icon" />
              </div>
              <div class="ui transparent left icon input">
                <input placeholder="Search..." type="text" />
                <i class="search icon" />
              </div>
              <div class="ui divider"></div>
              <div class="ui left icon input loading">
                <input placeholder="Loading..." type="text" />
                <i class="search icon" />
              </div>
              <div class="ui icon input loading">
                <input placeholder="Loading..." type="text" />
                <i class="search icon" />
              </div>
            </div>
            <div class="column">
              <div class="ui right labeled left icon input">
                <i class="tags icon" />
                <input placeholder="Enter tags" type="text" />
                <a class="ui tag label">
                  Add Tag
                </a>
              </div>
              <div class="ui divider"></div>
              <div class="ui labeled input">
                <a class="ui label">
                  Label
                </a>
                <input type="text" placeholder="Placeholder..." />
              </div>
              <div class="ui divider"></div>
              <div class="ui right labeled input">
                <input type="text" placeholder="Placeholder..." />
                <a class="ui label">
                  Label
                </a>
              </div>
              <div class="ui divider"></div>
              <div class="ui labeled icon input">
                <div class="ui label">
                  http://
                </div>
                <input type="text" placeholder="domain.com" />
                <i class="add circle link icon" />
              </div>
              <div class="ui right action input">
                <input type="text" placeholder="domain.com" />
                <div class="ui teal button">
                  <i class="add icon" />
                  Add
                </div>
              </div>
              <div class="ui divider"></div>
              <div class="ui corner labeled input">
                <input type="text" placeholder="Required Field" />
                <div class="ui corner label">
                  <i class="asterisk icon" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Header as='h4'>Card</Header>
        {/*
        <div class="ui four cards">
          <div class="ui card">
            <div class="image dimmable">
              <div class="ui blurring inverted dimmer">
                <div class="content">
                  <div class="center">
                    <div class="ui teal button">Add Friend</div>
                  </div>
                </div>
              </div>
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/image.png" />
            </div>
            <div class="content">
              <div class="header">Title</div>
              <div class="meta">
                <a class="group">Meta</a>
              </div>
              <div class="description">One or two sentence description that may go to several lines</div>
            </div>
            <div class="extra content">
              <a class="right floated created">Arbitrary</a>
              <a class="friends">
                Arbitrary</a>
            </div>
          </div>
          <div class="ui card">
            <div class="blurring dimmable image">
              <div class="ui dimmer">
                <div class="content">
                  <div class="center">
                    <div class="ui inverted button">Call to Action</div>
                  </div>
                </div>
              </div>
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/image.png" />
            </div>
            <div class="content">
              <a class="header">Name</a>
              <div class="meta">
                <span class="date">Date</span>
              </div>
            </div>
            <div class="extra content">
              <a>
                <i class="users icon" />
                Users
              </a>
            </div>
          </div>
          <div class="ui card">
            <div class="ui slide right reveal image">
              <div class="visible content">
                <img class="ui fluid image" src="https://semantic-ui.com/examples/assets/images/avatar/nan.jpg" />
              </div>
              <div class="hidden content">
                <img class="ui fluid image" src="https://semantic-ui.com/examples/assets/images/avatar/tom.jpg" />
              </div>
            </div>
            <div class="content">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/paragraph.png" class="ui wireframe image" />
            </div>
          </div>
          <div class="ui card">
            <div class="ui move reveal image">
              <div class="visible content">
                <img class="ui fluid image" src="https://semantic-ui.com/examples/assets/images/avatar/tom.jpg" />
              </div>
              <div class="hidden content">
                <img class="ui fluid image" src="https://semantic-ui.com/examples/assets/images/avatar/nan.jpg" />
              </div>
            </div>
            <div class="content">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/paragraph.png" class="ui wireframe image" />
            </div>
          </div>
        </div>
        <div class="ui four cards">
          <div class="ui card">
            <div class="extra content">
              <span class="left floated like">
                <i class="like icon" />
                Like
              </span>
              <span class="right floated star">
                <i class="star icon" />
                Favorite
              </span>
            </div>
            <div class="content">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/paragraph.png" class="ui wireframe image" />
            </div>
          </div>
          <div class="ui card">
            <div class="content">
              <div class="header">
                <img src="https://semantic-ui.com/examples/assets/images/wireframe/square-image.png" class="ui avatar right spaced image" />
                Abbreviated Header
              </div>
              <div class="description">
                <img src="https://semantic-ui.com/examples/assets/images/wireframe/paragraph.png" class="ui wireframe image" />
              </div>
            </div>
            <div class="ui two bottom attached buttons">
              <div class="ui button">
                Action 1
              </div>
              <div class="ui button">
                Action 2
              </div>
            </div>
          </div>
          <a href="#" class="ui card">
            <div class="content">
              <div class="header">Cute Dog</div>
              <div class="meta">
                <span class="category">Animals</span>
              </div>
              <div class="description">
                <img src="https://semantic-ui.com/examples/assets/images/wireframe/paragraph.png" class="ui wireframe image" />
              </div>
            </div>
            <div class="extra content">
              <div class="right floated author">
                <img src="https://semantic-ui.com/examples/assets/images/wireframe/square-image.png" class="ui avatar image" /> Username
              </div>
            </div>
          </a>
          <div class="ui card">
            <div class="ui two top attached basic buttons">
              <div class="ui button">
                Action 1
              </div>
              <div class="ui button">
                Action 2
              </div>
            </div>
            <div class="content">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/paragraph.png" class="ui wireframe image" />
            </div>
            <div class="ui two bottom attached basic buttons">
              <div class="ui button">
                Action 3
              </div>
              <div class="ui button">
                Action 4
              </div>
            </div>
          </div>
        </div>
        <div class="ui four cards">
          <div class="card">
            <div class="content">
              Content 1
            </div>
            <div class="content">
              Content 2
            </div>
            <div class="content">
              Content 3
            </div>
            <div class="extra content">
              Extra Content
            </div>
          </div>
          <div class="card">
            <div class="content">
              Content 1
            </div>
            <div class="content">
              Content 2
            </div>
            <div class="content">
              Content 3
            </div>
            <div class="extra content">
              Extra Content
            </div>
          </div>
          <div class="card">
            <div class="content">
              Content 1
            </div>
            <div class="content">
              Content 2
            </div>
            <div class="content">
              Content 3
            </div>
            <div class="extra content">
              Extra Content
            </div>
          </div>
          <div class="card">
            <div class="content">
              Content 1
            </div>
            <div class="content">
              Content 2
            </div>
            <div class="content">
              Content 3
            </div>
            <div class="extra content">
              Extra Content
            </div>
          </div>
        </div>
        <div class="ui four cards">
          <div class="card">
            <div class="image">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/image.png" />
            </div>
            <div class="extra center aligned">
              <div data-rating="4" class="ui star rating"><i class="icon active" /><i class="icon active" /><i class="icon active" /><i class="icon active" /></div>
            </div>
          </div>
          <div class="card">
            <div class="image">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/image.png" />
            </div>
            <div class="extra center aligned">
              <div data-rating="2" class="ui star rating"><i class="icon active" /><i class="icon active" /><i class="icon" /><i class="icon" /></div>
            </div>
          </div>
          <div class="card">
            <div class="image">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/image.png" />
            </div>
            <div class="extra center aligned">
              <div data-rating="3" class="ui star rating"><i class="icon active" /><i class="icon active" /><i class="icon active" /><i class="icon" /></div>
            </div>
          </div>
          <div class="card">
            <div class="image">
              <img src="https://semantic-ui.com/examples/assets/images/wireframe/image.png" />
            </div>
            <div class="extra center aligned">
              <div data-rating="4" class="ui star rating"><i class="icon active" /><i class="icon active" /><i class="icon active" /><i class="icon active" /></div>
            </div>
          </div>
        </div>
        <div style="clear: both; display: block;"></div> */}
      </div>
      </adminDesignTab>
    )
  }
}

module.exports = AdminDesign;

        