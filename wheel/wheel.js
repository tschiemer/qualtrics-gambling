/**
 * wheel.js
 * 
 * For demo see wheel.html
 * 
 * @copyright 2013 ETH Zurich, www.socio.ethz.ch, c/o Marc Hoeglinger <hoeglinger@soz.gess.ethz.ch>
 * @license http://www.gnu.org/licenses/gpl-2.0.txt
 * @author Philip Tschiemer <tschiemer@filou.se>
 * @link https://github.com/tschiemer/qualtrics-gambling
 * @version 2013-10-01
 */


    function Wheel(wheel_id, btn_rotate_id, options)
    {
        if (wheel_id == undefined || btn_rotate_id == undefined || options == undefined)
        {
            alert('Parameters not set. Please make sure to set <wheel_id>, <btn_rotate_id> and <options>.');
            return;
        }
        
        // Dice initialization
        
        // Required for correct referencing in anonymous functions
        var self = this;

        // Is Dice currently being thrown?
        this.is_busy = false;

        // Number of throws that can be made before controls are deactivated
        this.possible_throws = options.possible_throws == undefined ? 0 : options.possible_throws;
        
        // Number of throws currently done.
        this.done_throws     = 0;

        // Reference to dice DOM container
        this.wheel       = document.getElementById(wheel_id);         
        
        // Reference to throw button DOM
        this.btn_rotate  = document.getElementById(btn_rotate_id);
        
        // Set of all possible values following the structure
        // {key: "my_key", probability: 1} where the key field will be passed to any callback
        this.value_set = options.value_set;
        
        // Set of all predefined result keys, either an array of key values or
        // a string with comma-separated keys, ie
        // ['key1','key2',..,'keyN']   OR   'key1,key2,..,keyN'
        this.result_set = [];
        if (typeof options.result_set != 'undefined')
        {   
            this.first_throw_nr = 0;
            if (typeof options.first_throw_nr == 'string')
            {
                this.first_throw_nr = parseInt(options.first_throw_nr);
            }
            else if (typeof options.first_throw_nr == 'number')
            {
                this.first_throw_nr = Math.floor(options.first_throw_nr);
            }
            
//            var throw_index_strategy = 'couple';
//            if (typeof options.throw_index_strategy == 'string')
//            {
//                throw_index_strategy = options.throw_index_strategy;
//            }
//            if (throw_index_strategy == 'couple')
//            {
//                this.done_throws = this.first_throw_nr;
//            }
            
            if (typeof options.result_set == 'string')
            {
               this.result_set = options.result_set.replace(/ /g,'').split(',');
            }
            else
            {
                this.result_set = options.result_set;
            }
            
            if (this.possible_throws == 0)
            {
                this.possible_throws = this.result_set.length - this.first_throw_nr;
//                if (this.possible_throws +  > this.result_set.length)
//                {
//                    this.possible_throws = this.result_set.length - this.first_throw_nr;
//                }
            }
            
            this.fallback_strategy = 'wrap-around';
            if (typeof options.fallback_strategy == 'string')
            {
                this.fallback_strategy = options.fallback_strategy;
            }
        }
        
        // Duration of roll/throw animation, resp duration until result is shown.
        // Can be number or function returning a number
        // Default 1
        // In Seconds.
//        this.roll_duration = options.roll_duration == undefined ? 1 : options.roll_duration;
        
        // Callback function to receive any results
        // Signature: result_callback( throw_nr, result_key )
        //  throw_nr    : number of current throw starting with 1
        //  result_key  : key of throw result, as given through value_set 
        this.result_callback = null;
        if (options.result_callback !== undefined)
        {
            this.result_callback = options.result_callback;
        }
        
        if (this.possible_throws > 0 && options.finished_callback !== undefined)
        {
            this.finished_callback = options.finished_callback;
        }
        
        this.current_value_idx = 0;
        this.current_value = function()
        {
            return this.value_set[this.current_value_idx];
        }
        
        // default Animation options, can NOT be overriden
        this.animation = {
            mode                : (typeof options.animation_mode == 'string') ? options.animation_mode : 'sequence',
            tick_interval       : 10,
            max_degree          : 9,
            step_interpolator: function(x){
                if (x < 0) return 1;
                if (x > 1) return 0;
                if (x == 0) return 0.5; // slow start
                
                // interpolate between two different exponentials for a
                // longer high value and a less sudden drop
                return (1-x)*(1-Math.pow(x,4)) + (x)*(1-Math.pow(x,2));
            }
        };
        if (360 / this.value_set.length < this.animation.max_degree)
        {
            this.animation.max_degree = 360 / this.value_set.length;
        }
        
        // Store image options 
        if (options.images == undefined)
        {
            alert('Image settings missing.');
            return;
        }
        this.images = options.images;
        
        
        // Sanity checks: could DOM elements be found?
        if (this.wheel == null){
            alert('Dice ID not properly set, could not find an element with id '+dice_id);
            return;
        }
        if (this.btn_rotate == null){
            alert('Throw button ID not properly set, could not find an element.'+btn_throw_id);
            return;
        }


        //// Finalize Value Sets (sanity check and normalize probablities)
        var sum = 0, count=0;
        for(var v = 0; v < this.value_set.length; v++)
        {
            sum += this.value_set[v].probability;
            count++;
        }
        if (count == 0)
        {
            alert('No possible results entered.');
            return;
        }
        // if probablity sum = 0, assume uniform probablitiy distribution
        if (sum == 0)
        {
            var p = 1 / count;
            for (var v = 0; v < this.value_set.length; v++)
            {
                this.value_set[v].probability = p;
            }
        }
        else
        {
            for(var v = 0; v < this.value_set.length; v++)
            {
                this.value_set[v].probability /= sum;
            }
        }


        //// Setup HTML / Style
        
        this.wheel.innerHTML = '';
        this.wheel.style.height = this.images.img_size + 'px';
        this.wheel.style.overflow = 'hidden';
        
        
        // create colors image
        this.color_img = document.createElement('img');
        this.color_img.style.width      = this.images.img_size + 'px';
        this.color_img.style.height      = this.images.img_size + 'px';
        
        // create label image
        this.label_img = document.createElement('img');
        this.label_img.style.position = 'relative';
        this.label_img.style.top      = -this.images.img_size +'px';
        this.label_img.style.width    = this.images.img_size + 'px';
        this.label_img.style.height    = this.images.img_size + 'px';
        
//        if (this.animation.mode == 'sequence')
//        {
            this.color_img.src = this.images.base_url + this.current_value().color_img;
            this.label_img.src = this.images.base_url + this.current_value().label_img;
//        }
//        else if (this.animation.mode == 'crop')
//        {
//            var size = '0px, '+this.images.img_size + 'px,'+this.images.img_size+'px,0px';
//            
//            this.color_img.src = this.images.base_url + this.images.color_img;
//            this.color_img.style.clip = 'rect('+size+')';
//            this.label_img.src = this.images.base_url + this.images.label_img;
//            this.color_img.style.clip = 'rect('+size+')';
//        }

        this.wheel.appendChild(this.color_img);
        this.wheel.appendChild(document.createElement('br'));
        this.wheel.appendChild(this.label_img);
        this.wheel.appendChild(document.createElement('br'));
        
        
        if (typeof this.images.select_img == 'string')
        {
            var arrow_img = document.createElement('img');
            arrow_img.src            = this.images.base_url + this.images.select_img;
            arrow_img.style.position = 'relative';
            arrow_img.style.top      = -2*this.images.img_size +'px';
            arrow_img.style.width    = this.images.img_size + 'px';
            arrow_img.style.height    = this.images.img_size + 'px';

            this.wheel.appendChild(arrow_img);
            this.wheel.appendChild(document.createElement('br'));
        }
        
        // create final result description text
        this.desc_text = document.createElement('span');
        this.desc_text.style.display   = 'inline-block';
        this.desc_text.style.position = 'relative';
        var shift  = (typeof this.images.select_img == 'string' ? -3 : -2);
        this.desc_text.style.top      = (shift*this.images.img_size) +'px';
        this.desc_text.style.width      = this.images.img_size + 'px';
        this.desc_text.style.lineHeight = this.images.img_size + 'px';
        this.desc_text.style.textAlign  = 'center';
        this.desc_text.innerHTML        = '&nbsp;';
        this.wheel.appendChild(this.desc_text);
        

        // preload color and label images
        if (this.animation.mode == 'sequence')
        {
            for(var v = 0; v < this.value_set.length; v++)
            {
                var img;

                img = document.createElement('img');
                img.style.display = 'none';
                img.src = this.images.base_url + this.value_set[v].color_img;
                this.wheel.appendChild(img);

                img = document.createElement('img');
                img.style.display = 'none';
                img.src = this.images.base_url + this.value_set[v].label_img;
                this.wheel.appendChild(img);
            }
        }
//        else if (this.animation.mode == 'crop')
//        {
//            var img;
//            
//            img.document.createElement('imt');
//            img.style.display = 'none';
//            
//        }
        
        
        //// Object Methods
        
        
        this.deactivate_controls = function()
        {
            this.btn_rotate.disabled = true;
        }

        this.activate_controls = function()
        {
            this.btn_rotate.disabled = false;
        }


        // Throw dice
        this.rotate = function()
        {
            if (this.possible_throws > 0 && this.done_throws >= this.possible_throws)
            {
                return;
            }
            if (this.is_busy)
            {
                return;
            }
            this.is_busy = true;
            this.deactivate_controls();
            
            this.desc_text.innerHTML = '&nbsp;';

            // Determine result ..
            var result = null;
            
            // .. by relying on the given result
            if (this.result_set.length > 0 && (this.first_throw_nr + this.done_throws < this.result_set.length || this.fallback_strategy == 'wrap-around'))
            {
                var idx = (this.first_throw_nr + this.done_throws) % this.result_set.length;
                var result_key = this.result_set[idx];
                for(var i=0; i < this.value_set.length; i++)
                {
                    if (this.value_set[i].key == result_key)
                    {
                        result_idx = i;
                        break;
                    }
                }
            }
            // .. or by randomly drawing one.
            else
            {
                // Determine result (Monte Carlo style, 1 sample..)
                var p = Math.random();
                var sum = 0;
    //            var result = null;
                var result_idx = null;
                for(var v in this.value_set)
                {
                    sum += this.value_set[v].probability;
                    if (sum >= p)
                    {
    //                    result = this.value_set[v];
                        result_idx = v;
                        break;
                    }
                }
            }
            
//            alert('result = '+result_idx);
            
            var n_fields = 1 * this.value_set.length;
            if (result_idx < this.current_value_idx)
            {
                n_fields += this.current_value_idx  - result_idx;
            }
            else if (result_idx > this.current_value_idx)
            {
                n_fields += this.current_value_idx - result_idx;
            }
//            alert('n_fields = '+n_fields);
            

            // Start animation and tell it how many fields it must 
            this.start_animation(n_fields);            
            
        }
        this.btn_rotate.onclick = function(){self.rotate();return false;};


        // Animation internals
        
        this.animate_interval = 0;
        this.animate_field_countdown = 0;
        this.animate_degrees_to_next = 360 / this.value_set.length;

        // Start animation lasting <roll_duration> microseconds.
        this.start_animation = function(n_fields)
        {
            // If animation is alraedy running abort.
            if (this.animate_interval != 0)
            {
                return;
            }
            
            // Setup variables for actual animation tick function
            var self = this;
            this.animate_field_countdown = n_fields;

            // .. and start ticker.
            this.animate_interval = window.setInterval(function(){
                self.animation_tick(n_fields);
            },this.animation.tick_interval);
        }

        // Animation Step / Tick / Redraw function
        this.animation_tick = function(total_fields)
        {
            var deg_per_value = 360 / this.value_set.length;
            
            var rotate_step = this.animation.max_degree * this.animation.step_interpolator(1 - this.animate_field_countdown / total_fields);
            if (rotate_step <= 0 )
            {
                rotate_step = 1;
            }
            
            // Rotate images
            // Default rotation
            var deg = 0;

            // If image is already rotated, get current rotation degree.
            if (this.color_img.style.transform !== undefined)
            {
                deg = +this.color_img.style.transform.replace(/rotate\(|deg\)/g,'');

            }

            if (this.animate_degrees_to_next < rotate_step)
            {
                // update animation settings
                
                this.animate_field_countdown--;
                
                if (this.current_value_idx == 0)
                {
                    this.current_value_idx = this.value_set.length - 1;
                }
                else
                {
                    this.current_value_idx--;
                }
                
                // swap images
//                if (this.animation.mode == 'sequence')
                {
                    this.color_img.src = this.images.base_url + this.current_value().color_img;
                    this.label_img.src = this.images.base_url + this.current_value().label_img;
                }
//                else
//                {
//                    var size_color = '0px, '+((this.current_value_idx%2)*this.images.img_size) + 'px,'+((1 + this.current_value_idx%2)*this.images.img_size)+'px,0px';
//                        
//                    this.color_img.style.clip = 'rect('+size_color+')';
//                }
                
                
                // adjust rotation step to respect already rotated images
                rotate_step -= deg_per_value;
            }
            
            this.animate_degrees_to_next -= rotate_step;

            // Update rotation degree
            deg += rotate_step;

            // Set CSS rotation image
            
//            var iecos = Math.cos(deg * Math.PI / 180);
//            var iesin = Math.sin(deg * Math.PI / 180);
            
            this.color_img.style.transform = 'rotate('+deg+'deg)';
            this.color_img.style['-webkit-transform'] = 'rotate('+deg+'deg)';
            this.color_img.style['-ms-transform'] = 'rotate('+deg+'deg)';
            this.color_img.style['-moz-transform'] = 'rotate('+deg+'deg)';
            this.color_img.style['-o-transform'] = 'rotate('+deg+'deg)';
//            this.color_img.style['filter'] = 'progid:DXImageTransform.Microsoft.Matrix(M11='+iecos+',M21='+iesin+',M22='+iecos+',M12='+(-iesin)+', sizingMethod="auto expand")';
            
            this.label_img.style.transform = 'rotate('+deg+'deg)';
            this.label_img.style['-webkit-transform'] = 'rotate('+deg+'deg)';
            this.label_img.style['-ms-transform'] = 'rotate('+deg+'deg)';
            this.label_img.style['-moz-transform'] = 'rotate('+deg+'deg)';
            this.label_img.style['-o-transform'] = 'rotate('+deg+'deg)';
//            this.label_img.style['filter'] = 'progid:DXImageTransform.Microsoft.Matrix(M11='+iecos+',M21='+iesin+',M22='+iecos+',M12='+(-iesin)+', sizingMethod="auto expand")';

            if ( this.animate_field_countdown <= 0)
            {
                this.show_result(this.current_value());
            }
        }

        // Stop all animation
        this.stop_animation = function()
        {
            // If animation ticker is not active, abort
            if (this.animate_interval == 0)
            {
                return;
            }

            // Clear animatino ticker
            window.clearInterval(this.animate_interval);
            this.animate_interval = 0;
        }

        // Show throw result and enabled controls again.
        this.show_result = function(result)
        {
            this.stop_animation();

//            this.color_img.
//            this.dice_img.src = this.images.base_url + result.key + this.images.ext; 

            this.is_busy = false;
            this.done_throws++;
            
            if (typeof result.description == 'string')
            {
                this.desc_text.innerHTML = result.description;
            }
            
            // If a callback function has been set, call it.
            if (this.result_callback != null)
            {
                this.result_callback(this.done_throws, result.key);
            }

            if (this.possible_throws == 0 || this.done_throws < this.possible_throws)
            {
                this.activate_controls();
            }
            else if (typeof this.finished_callback != 'undefined')
            {
                this.finished_callback();
            }
        }
    }

    // Alternative initialization function to be used when not 
    function wheel_create_here(btn_rotate_label, options)
    {
        // Generate random HTML tag ids.
        var wheel_id         = 'wheel_' + Math.floor(1000*Math.random());
        var btn_rotate_id    = 'btn_rotate_' + Math.floor(1000*Math.random());

        // Add required HTML elements to document.
        document.write('<div id="'+wheel_id+'"></div>');
        document.write('<button id="'+btn_rotate_id+'">'+btn_rotate_label+'</button>');
        
        // Initialize dice by standard method. Use little safety delay.
        window.setTimeout(function(){new Wheel(wheel_id, btn_rotate_id, options);},10);
    }
    
    
    // If you load this file dynamically and want to run your custom code when it has finished
    // loading, you can defined <dive_js_load_callback> as your callback function
    if (typeof wheel_js_load_callback != 'undefined')
    {
        wheel_js_load_callback();
    }