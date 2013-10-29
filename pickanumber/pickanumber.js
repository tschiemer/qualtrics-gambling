/**
 * pickanumber.js
 * 
 * For demo see pickanumber.html
 * 
 * @copyright 2013 ETH Zurich, www.socio.ethz.ch, c/o Marc Hoeglinger <hoeglinger@soz.gess.ethz.ch>
 * @license http://www.gnu.org/licenses/gpl-2.0.txt
 * @author Philip Tschiemer <tschiemer@filou.se>
 * @link https://github.com/tschiemer/qualtrics-gambling
 * @version 2013-10-01
 */

function PickANumber(table_id, btn_show_id, fields, options)
{
    var self = this;
    
    this.table = document.getElementById(table_id);
    this.btn_show = document.getElementById(btn_show_id);
    
    this.options = {
        shuffle : false,
        //dim : [1,fields.length],
        field_style : {
            'vertical-align': 'top',
            'text-align'    : 'center'
        }
    };
    
    if (typeof options != 'undefined')
    {
        for(var key in options)
        {
            this.options[key] = options[key];
        }
    }
    
    // Create collection of all fields
    var has_multiplicities = false;
    this.fields = [];
    for(var f = 0; f < fields.length; f++)
    {
        var field = fields[f];
        var i = typeof field.multiplicity == 'number' ? field.multiplicity : 1;
        
        while(0 < i--)
        {
            var copy = {};
            for( var k in field)
            {
                copy[k] = field[k];
            }
            this.fields.push(copy);
        }
    }
    
    if (typeof this.options.dim == 'undefined')
    {
        this.options.dim = [1,this.fields.length];
    }
    else if (typeof this.options.dim == 'number' && this.options.dim == 2)
    {
        var r = Math.ceil(Math.sqrt(this.fields.length));
        this.options.dim = [r,r];
    }
    else if (this.options.dim[0] * this.options.dim[1] < this.fields.length)
    {
        alert('Trying to create a '+this.options.dim[0]+'x'+this.options.dim[1]+' Matrix for a total of '+this.fields.length+' elements. Please adjust matrix dimensions to fit fields.');
        return;
    }
    
    // Shuffle fields randomly if so wanted
    if (this.options.shuffle)
    {
        // assign a random real number in [0,1] to each field
        for (var s = 0; s < this.fields.length; s++)
        {
            this.fields[s].sort_index = Math.random();
        }
        
        // sort fields according to random number, ie pick random permutation of fields
        this.fields.sort(function(a,b){
            return a.sort_index - b.sort_index;
        });
    }
    
    // Set index of each field according to position
    for(var f =0; f < this.fields.length; f++)
    {
        this.fields[f].index = f+1;
    }
    
    
    var tbody = document.createElement('tbody');
    this.table.appendChild(tbody);
    
    for (var r = 1, f=0; r <= this.options.dim[0]; r++)
    {
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        
        for (var c = 1; c <= this.options.dim[1]; c++)
        {
            var td = document.createElement('td');
            
            for(var s in this.options.field_style)
            {
                td.style[s] = this.options.field_style[s];
            }
            
            if (f >= this.fields.length)
            {
                td.className = 'pan-empty pan-row-'+r+' pan-col-'+c;
            }
            else
            {

                var field = this.fields[f];

                field.td = td;

                var content = '';
                switch(field.type)
                {
                    default:
                    case 'asis':
                        content = field.hidden;
                        break;
                }
                field.td.innerHTML = content.replace(/\{\{index\}\}/g,field.index);
                field.td.className = 'pan-index-'+field.index+' pan-row-'+r+' pan-col-'+c;

            }
            
            
            tr.appendChild(td);
            
            f++;
        }
    }
    
    
    
    this.show = function()
    {
        for(var f = 0; f < this.fields.length; f++)
        {
            var field = this.fields[f];

            var content = '';
            switch (field.type)
            {
                default:
                case 'asis':
                    content = field.visible;
                    break;
            }
            field.td.innerHTML = content.replace(/\{\{index\}\}/g,field.index);
        }
        
        this.btn_show.disabled = true;
    }
    this.btn_show.onclick = function(){self.show();return false;}
}

function pickanumber_create_here(btn_show_label,fields,options)
{
    var table_id    = 'pan_table_'+Math.floor(1000*Math.random());
    var btn_show_id = 'pan_show_'+Math.floor(1000*Math.random());
    
    document.write('<table id="'+table_id+'"></table>');
    document.write('<button id="'+btn_show_id+'">'+btn_show_label+'</button>');
    
    new PickANumber(table_id,btn_show_id,fields,options);
}