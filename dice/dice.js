/**
 * dice.js
 * 
 * For demo see dice.html
 * 
 * @copyright 2013 ETH Zurich, www.socio.ethz.ch, c/o Marc Hoeglinger <hoeglinger@soz.gess.ethz.ch>
 * @license http://www.gnu.org/licenses/gpl-2.0.txt
 * @author Philip Tschiemer <tschiemer@filou.se>
 * @link https://github.com/tschiemer/qualtrics-gambling
 * @version 2013-10-01
 */


    function Dice(dice_id, btn_throw_id, options)
    {
        if (dice_id == undefined || btn_throw_id == undefined || options == undefined)
        {
            alert('Parameters not set. Please make sure to set <dice_id>, <btn_throw_id> and <options>.');
            return;
        }
        
        // Dice initialization
        
        // Required for correct referencing in anonymous functions
        var self = this;

        // Is Dice currently being thrown?
        this.is_throwing = false;

        // Number of throws that can be made before controls are deactivated
        this.possible_throws = options.possible_throws == undefined ? 0 : options.possible_throws;
        
        // Number of throws currently done.
        this.done_throws     = 0;
        
        // Reference to dice DOM container
        this.dice       = document.getElementById(dice_id);         
        
        // Reference to throw button DOM
        this.btn_throw  = document.getElementById(btn_throw_id);
        
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
        this.roll_duration = options.roll_duration == undefined ? 1 : options.roll_duration;
        
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
        
        // default Animation options, can be overriden
        this.animation = {
            rotate: true,           // Rotate image?
            swap_images: true,      // Randomly swap images during animation?
            nsteps: 20,             // Number of steps a rotation is divided into.
            change_image_all: 5     // Swap images each n-th step where n = this setting
        };
        
        // override animation settings with given options
        if (options.animation !== undefined)
        {
            for(var key in options.animation)
            {
                this.animation[key] = options.animation[key];
            }
        }
        
        // Store image options 
        if (options.images == undefined)
        {
            alert('Image settings missing.');
            return;
        }
        this.images = options.images;
        
        
        // Sanity checks: could DOM elements be found?
        if (this.dice == null){
            alert('Dice ID not properly set, could not find an element with id '+dice_id);
            return;
        }
        if (this.btn_throw == null){
            alert('Throw button ID not properly set, could not find an element.'+btn_throw_id);
            return;
        }

//        if (options.btn_reset_id !== undefined)
//        {
//            this.btn_reset      = document.getElementById(options.btn_reset_id);
//            if (this.btn_reset == null){
//                alert('Reset button id not properly set, could not find an element with id '+options.btn_reset_id);
//                return;
//            }
//            this.reset = function()
//            {
//                if (this.callback != null)
//                {
//                    while(this.done_throws > 0)
//                    {
//                        this.callback('reset_throw',this.done_throws);
//                        this.done_throws--;
//                    }
//                }
//            }
//            this.btn_reset.onclick = function(){self.reset();};
//        }


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
        
        // 
        this.dice.innerHTML = '';
        
        // create main image
        this.dice_img = document.createElement('img');
        if (typeof this.images.init != 'undefined')
        {
            this.dice_img.src = this.images.base_url + this.images.init;
        }
        else
        {
            this.dice_img.src = this.images.base_url + this.value_set[0].key + this.images.ext;
        }
        //this.dice_img.style.cursor = 'pointer';
        this.dice.appendChild(this.dice_img);

        // preload result images
        for(var v = 0; v < this.value_set.length; v++)
        {
            var img = document.createElement('img');
            img.style.display = 'none';
            img.src = this.images.base_url + this.value_set[v].key + this.images.ext;

            this.dice.appendChild(img);
        }

        // preload animation images
        if (this.animation.images !== undefined)
        {
            for(var i = 0; i < this.animation.images.length; i++ )
            {
                var img = document.createElement('img');
                img.style.display = 'none';
                img.src = this.images.base_url + this.animation.images[i];

                this.dice.appendChild(img);
            }
        }
        
        
        //// Object Methods
        
        
        this.deactivate_controls = function()
        {
            this.btn_throw.disabled = true;
//            if (this.btn_reset !== undefined)
//            {
//                this.btn_reset.disabled = true;
//            }
        }

        this.activate_controls = function()
        {
            this.btn_throw.disabled = false;
//            if (this.btn_reset !== undefined)
//            {
//                this.btn_reset.disabled = false;
//            }
        }


        // Throw dice
        this.throw_dice = function()
        {
            if (this.possible_throws > 0 && this.done_throws >= this.possible_throws)
            {
                return;
            }
            if (this.is_throwing)
            {
                return;
            }
            this.is_throwing = true;
            this.deactivate_controls();

            // get roll duration
            var roll_duration;
            if (typeof this.roll_duration == 'number')
            {
                roll_duration = this.roll_duration;
            }
            else
            {
                roll_duration = this.roll_duration();
            }
            roll_duration = Math.floor(1000*roll_duration); // is in millisec

            // Start animation and tell it how long it will likely last (required for computation of 
            this.start_animation(roll_duration);


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
                        result = this.value_set[i];
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
                for(var v in this.value_set)
                {
                    sum += this.value_set[v].probability;
                    if (sum >= p)
                    {
                        result = this.value_set[v];
                        break;
                    }
                }
            }

            // Set timeout for stopping animatino and showing result
            var self = this;
            window.setTimeout(function(){
                self.show_result(result);
            }, roll_duration);
        }
        this.btn_throw.onclick = function(){self.throw_dice();return false;};


        // Animation internals
        
        this.animate_interval = 0;
        this.animate_step_counter = null;

        // Start animation lasting <roll_duration> microseconds.
        this.start_animation = function(roll_duration)
        {
            // If animation is alraedy running abort.
            if (this.animate_interval != 0)
            {
                return;
            }

            // Each rotation is shown in <nsteps> steps.
            var nsteps = this.animation.nsteps;
            
            // Each <chance_image_all> steps the image is swapped
            var change_image_all = this.animation.change_image_all;


            // compute step timing and according rotation to get a nice rounded off rotation

            // at least 1 rotation, number of rotations dependent on roll/animation duration
            var rotations = 1 + Math.floor(roll_duration / 2000);

            var time_per_rot = roll_duration / rotations;
            var time_per_step = time_per_rot / nsteps;

            // Degree change per step
            var rotate_step = this.animation.rotate ? 360 / nsteps : 0;
    
            // Setup variables for actual animation tick function
            var self = this;
            this.animation_step_counter = 0;

            // .. and start ticker.
            this.animate_interval = window.setInterval(function(){
                self.animation_tick(change_image_all, rotate_step);
            },time_per_step);
        }

        // Animation Step / Tick / Redraw function
        this.animation_tick = function(change_image_all,rotate_step)
        {
            // swap image
            if (this.animation_step_counter == 0 && this.animation.swap_images)
            { 

                var img_src;

                // if animation images are set, pick from these..
                if (this.animation.images !== undefined && this.animation.images.length > 0)
                {
                    var img_i = Math.floor(this.animation.images.length * Math.random()) % this.animation.images.length;
                    img_src = this.animation.images[img_i];
                }
                
                // .. otherwise pick from result images.
                else
                {
                    var img_i = Math.floor(this.value_set.length * Math.random()) % this.value_set.length;
                    img_src = this.value_set[img_i].key + this.images.ext;
                }

                // update image
                this.dice_img.src = this.images.base_url + img_src; 
            }

            this.animation_step_counter = (this.animation_step_counter + 1) % change_image_all;


            // Rotate image
            if (this.animation.rotate)
            {
                // Default rotation
                var deg = 0;

                // If image is already rotated, get current rotation degree.
                if (this.dice_img.style.transform !== undefined)
                {
                    deg = +this.dice_img.style.transform.replace(/rotate\(|deg\)/g,'');

                }
                
                // Update rotation degree
                deg += rotate_step;

                // Set CSS rotation image
                this.dice_img.style.transform = 'rotate('+deg+'deg)';
                this.dice_img.style['-webkit-transform'] = 'rotate('+deg+'deg)';
                this.dice_img.style['-ms-transform'] = 'rotate('+deg+'deg)';
                this.dice_img.style['-moz-transform'] = 'rotate('+deg+'deg)';
                this.dice_img.style['-o-transform'] = 'rotate('+deg+'deg)';
                
                //var iecos = Math.cos(deg * Math.PI / 180);
                //var iesin = Math.sin(deg * Math.PI / 180);
                //this.dice_img.style['filter'] = 'progid:DXImageTransform.Microsoft.Matrix(M11='+iecos+',M21='+iesin+',M22='+iecos+',M12='+(-iesin)+', sizingMethod="auto expand")';
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

            // Set rotation degrees to original state (0 degrees)
            if (this.animation.rotate)
            {
                this.dice_img.style.transform = 'rotate(0deg)';
                this.dice_img.style['-webkit-transform'] = 'rotate(0deg)';
                this.dice_img.style['-ms-transform'] = 'rotate(0deg)';
                this.dice_img.style['-moz-transform'] = 'rotate(0deg)';
                this.dice_img.style['-o-transform'] = 'rotate(0deg)';
                
                //this.dice_img.style['filter'] = 'progid:DXImageTransform.Microsoft.Matrix(1,0,1,0, "auto expand")';
            }
        }

        // Show throw result and enabled controls again.
        this.show_result = function(result)
        {
            this.stop_animation();

            this.dice_img.src = this.images.base_url + result.key + this.images.ext; 

            this.is_throwing = false;
            this.done_throws++;
            
            // If a callback function has been set, call it.
            if (this.result_callback != null)
            {
            	window.setTimeout( function(){
	                self.result_callback(self.done_throws, result.key);
	            }, 10);
            }

            if (this.possible_throws == 0 || this.done_throws < this.possible_throws)
            {
                this.activate_controls();
            }
            else if (typeof this.finished_callback != 'undefined')
            {
            	window.setTimeout( function(){
	                this.finished_callback();
	            }, 10);
            }
        }
    }

    // Alternative initialization function to be used when not 
    function dice_create_here(btn_throw_label, options)
    {
        // Generate random HTML tag ids.
        var dice_id         = 'dice_' + Math.floor(1000*Math.random());
        var btn_throw_id    = 'btn_throw_' + Math.floor(1000*Math.random());
//        var btn_reset_id    = 'btn_reset_' + Math.floor(1000*Math.random());

        // Add required HTML elements to document.
        document.write('<div id="'+dice_id+'"></div>');
        document.write('<button id="'+btn_throw_id+'">'+btn_throw_label+'</button>');
        
//        if (btn_reset_label != null)
//        {
//            document.write('<button id="'+btn_reset_id+'">'+btn_reset_label+'</button>');
//            options.btn_reset_id = btn_reset_id;
//        }

        // Initialize dice by standard method. Use little safety delay.
        window.setTimeout(function(){new Dice(dice_id, btn_throw_id, options);},10);
    }
    
    
    // If you load this file dynamically and want to run your custom code when it has finished
    // loading, you can defined <dive_js_load_callback> as your callback function
    if (typeof dice_js_load_callback != 'undefined')
    {
        dice_js_load_callback();
    }