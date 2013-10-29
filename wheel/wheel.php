<?php
/**
 * wheel.php
 * 
 * Wheel image generator, please see wheel.html
 * 
 * @todo Refactor.
 * 
 * Required extensions:
 * - Zip
 * - Imagick
 * 
 * 
 * @copyright 2013 ETH Zurich, www.socio.ethz.ch, c/o Marc Hoeglinger <hoeglinger@soz.gess.ethz.ch>
 * @license http://www.gnu.org/licenses/gpl-2.0.txt
 * @author Philip Tschiemer <tschiemer@filou.se>
 * @link https://github.com/tschiemer/qualtrics-gambling
 * @version 2013-10-01
 */

$require_authorization = FALSE;
$username = 'billy';
$password = 'vanilly';

if ($require_authorization and 
        (!isset($_SERVER['PHP_AUTH_USER']) or !isset($_SERVER['PHP_AUTH_PW'])
        or $_SERVER['PHP_AUTH_USER'] != $username or $_SERVER['PHP_AUTH_PW'] != $password)) {
    header('WWW-Authenticate: Basic realm="Lucky Wheel"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'You are not authorized.';
    exit;
}

/***************************************************
 * Settings
 */

// default image size (in theory, could be adjusted dynamically, but not done here)
$img_size = 400;

// general stroke width (used for circles)
$stroke_width = 1;

// radius of outer and inner circles
$radius_outer = ($img_size - $stroke_width - 10 )/2;
$radius_inner = ($img_size/2) * 0.7;

// Get/Set font size
$font = array(
    'size'  => isset($_REQUEST['font_size']) ? $_REQUEST['font_size'] : 20
);

// compute radius in which to write the labels w.r.t. font-size
$radius_write = $radius_inner + ($radius_outer - $radius_inner) / 2 - $font['size'] / 3;


// get all wheel settings

$slice_count = isset($_REQUEST['slice_count']) ? $_REQUEST['slice_count'] : 4;

$slice_colors = array(
    'red','green','blue','white'
);
if (isset($_REQUEST['slice_color']) and is_array($_REQUEST['slice_color']))
{
    $slice_colors = $_REQUEST['slice_color'];
}
if (isset($_REQUEST['color_count']))
{
    $color_count = $_REQUEST['color_count'];
}
else
{
    $color_count = count($slice_colors);
}

$slice_labels = array('label1','label2','label3','label4');
if (isset($_REQUEST['slice_label']) and is_array($_REQUEST['slice_label']))
{
    $slice_labels = $_REQUEST['slice_label'];
}

// generate datastructure used henceforth (could be refactored and simplified)
$slices = array();
for($i=0,$ci=0; $i < $slice_count; $i++,$ci=(($ci+1)%count($slice_colors)))
{
    $slices[] = array(
        'label' => $slice_labels[$i],
        'color' => $slice_colors[$ci]
    );
}


// create zipfile for later download
$zipname = tempnam(sys_get_temp_dir(),'');

$zip = new ZipArchive;
$res = $zip->open($zipname,ZipArchive::OVERWRITE);
if ($res !== TRUE) {
    die('could not create zipfile with images');
}




/***************************************************
 * Helper Functions
 */

// thanks to commentor on php.org
function image_pie( &$canvas, $ox, $oy, $radius, $sd, $ed, $color = 'black' ) { 

    //  draw pie segment 
    //  $ox, $oy specify the circle origin 
    //  $sd, and $ed specify start and end angles in degrees 
    //  degrees start from 0 = East, and go clockwise 

    //  position 1 - convert degrees to radians and get first point on perimeter of circle 
    $x1     = $radius * cos($sd / 180 * 3.1416); 
    $y1     = $radius * sin($sd / 180 * 3.1416); 

    //  position 2 - convert degrees to radians and get second point on perimeter of circle 
    $x2     = $radius * cos($ed / 180 * 3.1416); 
    $y2     = $radius * sin($ed / 180 * 3.1416); 

    //  draw segment triangle - specify the 3 points and draw a polygon 
    $points = array(array('x' => $ox, 'y' => $oy), array('x' => $ox + $x1, 'y' => $oy + $y1), array('x' => $ox + $x2, 'y' => $oy + $y2)); 

    image_polygon($canvas, $points, $color); 

    //  draw corrsesponding arc to complete the "pie" segment 
    image_arc($canvas, $ox - $radius, $oy - $radius, $ox + $radius, $oy + $radius, $sd, $ed, $color); 
} 

// thanks to commentor on php.org
function image_arc( &$canvas, $sx, $sy, $ex, $ey, $sd, $ed, $color = 'black' ) { 

    //  draw arc on canvas 
    //  $sx, $sy, $ex, $ey specify a bounding rectangle of a circle with the origin in the middle 
    //  $sd, and $ed specify start and end angles in degrees 

    $draw = new ImagickDraw(); 
    $draw->setFillColor($color); 
//    $draw->setStrokeColor($color); 
//    $draw->setStrokeWidth(1); 
    $draw->arc($sx, $sy, $ex, $ey, $sd, $ed); 
    $canvas->drawImage($draw); 
} 

// thanks to commentor on php.org
function image_polygon( &$canvas, $points, $color = 'black' ) { 

    //  draw a polygon on canvas 

    $draw = new ImagickDraw(); 
    $draw->setFillColor($color); 
//    $draw->setStrokeColor($color); 
//    $draw->setStrokeWidth(1); 
    $draw->polygon($points); 
    $canvas->drawImage($draw); 
} 

function image_rotate(&$canvas, $degrees, $bgcolor='none')
{
    $size_orig = $canvas->getImageWidth();
//    $canvas->setImageGravity(Imagick::GRAVITY_CENTER);
    $canvas->rotateImage(color($bgcolor),$degrees);
    $size_new = $canvas->getImageWidth();
    
    if ($size_new > $size_orig)
    {
        $translate = new ImagickDraw();
        $t_val = ($size_new - $size_orig)/2;
        $translate->translate(-$t_val,-$t_val);
        $canvas->drawImage( $translate );

        $canvas->cropImage($size_orig,$size_orig,0,0);
    }
}

function image_crop_to(&$canvas, $img_size)
{
    $size_orig = $img_size;
    $size_new = $canvas->getImageWidth();
    
    $translate = new ImagickDraw();
    $t_val = ($size_new - $size_orig)/2;
    $translate->translate(-$t_val,-$t_val);
    $canvas->drawImage( $translate );
    
    $canvas->cropImage($size_orig,$size_orig,0,0);
}


function color($code)
{
    global $colors;
    
    if (!isset($colors) or !is_array($colors))
    {
        $colors['white'] = new ImagickPixel('white');
        $colors['black'] = new ImagickPixel('black');
    }
    
    if (!isset($colors[$code]))
    {
        $colors[$code] = new ImagickPixel($code);
    }
    
    return $colors[$code];
}




/***************************************************
 * Image(s) construction
 */

try
{
        $im = new Imagick();

        $im->newImage( $img_size, $img_size, color('white') );


        // draw pie
        
        $current_degrees = 0;
        $change_degrees = 360 / count($slices);
        
        foreach($slices as $slice)
        {
//            $slice = $slices['key1'];
            image_pie($im, $img_size/2, $img_size/2, $radius_outer-1, $current_degrees, $current_degrees+$change_degrees, color($slice['color']));
            
            $current_degrees += $change_degrees;
        }
        
        
        // create outer circle
        
        $outer = new ImagickDraw();
        $outer->setFillOpacity( 0.0 );
        $outer->setStrokeColor( color('black'));
        $outer->setStrokeWidth( $stroke_width );
        $outer->ellipse( $img_size / 2, $img_size / 2, $radius_outer, $radius_outer, 0, 360 );
        $im->drawImage( $outer );
        
        
        // create inner circle
        $inner = new ImagickDraw();
        $inner->setFillColor( color('white') );
        $inner->setFillOpacity( 1.0 );
        $inner->setStrokeColor( color('black'));
        $inner->setStrokeWidth( $stroke_width );
        $inner->ellipse( $img_size / 2, $img_size / 2, $radius_inner, $radius_inner, 0, 360 );
        $im->drawImage( $inner );
        
        
        // rotate image to have first slice to be at top
        image_rotate($im, -90 - $change_degrees/2, 'white');

        // set color images file settings
        $im->setImageCompression(Imagick::COMPRESSION_JPEG); 
        $im->setImageCompressionQuality(90); 
        $im->setImageFormat( "jpg" );

        // generate all (rotated) images
        $current_degrees = 0;
        for($i = 0; $i < count($slice_colors) and $i < $slice_count and $i < $color_count;$i++)
        {
            $cm = $im->clone();
            
            image_rotate($cm, $current_degrees, 'white');
            
            $istr = $i+1; // start file index at 1 (not 0)
            
            $zip->addFromString("color-{$istr}.jpg", $cm->getImageBlob());
            
            $current_degrees -= $change_degrees;
        }
        
 
        // create prototype label image
        
        $text = new Imagick();
        $text->newImage($img_size,$img_size,color('transparent'));
        
        $writer = new ImagickDraw();
        $writer->setFontSize($font['size']);
        
        $current_degrees = -90;
        for($i = 0; $i < count($slice_labels) and $i < $slice_count; $i++)
        {
            $label = $slice_labels[$i];
            $txtlen = strlen($label);
            
            $deg = $current_degrees - 2*$txtlen*($font['size']/20);
            
            $x = $img_size / 2 + $radius_write * cos($deg / 180 * 3.1416);
            $y = $img_size / 2 + $radius_write * sin($deg / 180 * 3.1416);
            $text->annotateImage( $writer, $x, $y, 90+$current_degrees, $label );
            $current_degrees += $change_degrees;
        }

        
        // combine text and wheel in the wheel-file
        $im->compositeImage($text,Imagick::COMPOSITE_DEFAULT,0,0);
        $zip->addFromString('wheel.jpg', $im->getImageBlob());
        
        
        // create rotated label images
        
        $text->setImageFormat( "png" );
        
        $current_degrees = 0;
        for($i = 0; $i < count($slice_labels) and $i < $slice_count; $i++)
        {
            $cm = $text->clone();
            
            image_rotate($cm, $current_degrees,'none');
            
            $istr = $i + 1;
            
            $zip->addFromString("label-{$istr}.png", $cm->getImageBlob());
            
            $current_degrees -= $change_degrees;
        }
        
        
        // add pointer/arrow
        $arrow_img = file_get_contents('img/arrow.png');
        $zip->addFromString('arrow.png',$arrow_img);
        
        $zip->close();
        
        // set filename for download
        $filename = "wheel_img_pieces{$slice_count}_colors{$color_count}.zip";
        
        // output zip file
        header('Content-Type: application/zip');
        header("Content-Disposition: attachment; filename=\"{$filename}\"");
        echo file_get_contents($zipname);
        exit;
        
}
catch(Exception $e)
{
        echo $e->getMessage();
}
